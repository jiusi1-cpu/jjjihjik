const config = window.APP_CONFIG || {};
const appRoot = document.getElementById("app");
const toastNode = document.getElementById("toast");
const supabaseFactory = window.supabase;
const nativeFilePicker = window.Capacitor?.Plugins?.NativeFilePicker;

const state = {
  supabase: null,
  session: null,
  user: null,
  profile: null,
  files: [],
  selectedFiles: [],
  uploadTasks: [],
  authMode: "login",
  authSubmitting: false,
  uploading: false,
  loadingFiles: false,
  deletingId: null,
  downloadingId: null
};

const ALLOWED_MIME_TYPES = config.allowedMimeTypes || {};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showToast(message, type = "info") {
  if (!toastNode) return;
  toastNode.textContent = message;
  toastNode.className = `toast ${type}`;
  toastNode.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toastNode.hidden = true;
  }, 2800);
}

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => window.setTimeout(() => reject(new Error(message)), ms))
  ]);
}

function formatBytes(value) {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const size = value / 1024 ** exponent;
  return `${size.toFixed(size >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}

function formatDate(value) {
  if (!value) return "暂无";
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function normalizeUsername(value) {
  return value.trim();
}

function usernameToEmail(username) {
  const normalized = normalizeUsername(username);
  const encoded = encodeURIComponent(normalized).replace(/%/g, "").toLowerCase();
  return `u_${encoded}@personal-file-center.local`;
}

function isEmailLike(value) {
  return value.includes("@");
}

function validateFileType(file) {
  if (ALLOWED_MIME_TYPES[file.type]) {
    return true;
  }
  const extension = file.name.split(".").pop()?.toLowerCase();
  return ["pdf", "txt", "png", "jpg", "jpeg", "webp", "doc", "docx", "xls", "xlsx", "zip"].includes(extension || "");
}

function isFileSizeValid(size) {
  return size > 0 && size <= config.maxFileSize;
}

function getFileExtension(fileName) {
  const rawExtension = fileName.split(".").pop()?.toLowerCase() ?? "bin";
  const safeExtension = rawExtension.replace(/[^a-z0-9]/g, "");
  return safeExtension || "bin";
}

function buildStoragePath(userId, fileName) {
  return `${userId}/${crypto.randomUUID()}.${getFileExtension(fileName)}`;
}

function getDisplayName() {
  return state.profile?.full_name || state.user?.user_metadata?.full_name || state.user?.email || "用户";
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function mapNativePickedFile(file) {
  const bytes = base64ToBytes(file.data || "");
  const blob = new Blob([bytes], { type: file.mimeType || "application/octet-stream" });
  return {
    name: file.name || "file",
    size: file.size || bytes.byteLength,
    type: file.mimeType || "application/octet-stream",
    blob
  };
}

function updateTask(taskId, status, detail) {
  state.uploadTasks = state.uploadTasks.map((task) => (task.id === taskId ? { ...task, status, detail } : task));
  render();
}

function render() {
  if (!config.supabaseUrl || !config.supabaseAnonKey || !supabaseFactory?.createClient) {
    appRoot.innerHTML = `
      <div class="center-state">
        <div class="brand-dot"></div>
        <h1>配置缺失</h1>
        <p>请先重新生成独立版资源。</p>
      </div>
    `;
    return;
  }

  appRoot.innerHTML = state.session ? renderMain() : renderAuth();
  bindEvents();
}

function renderAuth() {
  return `
    <div class="auth-shell">
      <section class="auth-card">
        <div class="card-body">
          <h1 class="title">个人文件中心</h1>
          <p class="subtitle">只保留登录和注册</p>
          <div class="switch">
            <button type="button" class="${state.authMode === "login" ? "active" : ""}" data-auth-mode="login">登录</button>
            <button type="button" class="${state.authMode === "register" ? "active" : ""}" data-auth-mode="register">注册</button>
          </div>
          ${state.authMode === "login" ? renderLoginForm() : renderRegisterForm()}
        </div>
      </section>
    </div>
  `;
}

function renderLoginForm() {
  return `
    <form id="login-form" class="form">
      <div class="field">
        <label for="login-account">用户名</label>
        <input id="login-account" name="account" type="text" required autocomplete="username" placeholder="请输入用户名" />
      </div>
      <div class="field">
        <label for="login-password">密码</label>
        <input id="login-password" name="password" type="password" required minlength="6" autocomplete="current-password" placeholder="请输入密码" />
      </div>
      <button class="btn" type="submit" ${state.authSubmitting ? "disabled" : ""}>${state.authSubmitting ? "登录中…" : "登录"}</button>
    </form>
  `;
}

function renderRegisterForm() {
  return `
    <form id="register-form" class="form">
      <div class="field">
        <label for="register-username">用户名</label>
        <input id="register-username" name="username" type="text" required autocomplete="username" placeholder="请输入用户名" />
      </div>
      <div class="field">
        <label for="register-password">密码</label>
        <input id="register-password" name="password" type="password" required minlength="6" autocomplete="new-password" placeholder="至少 6 位密码" />
      </div>
      <button class="btn" type="submit" ${state.authSubmitting ? "disabled" : ""}>${state.authSubmitting ? "注册中…" : "注册"}</button>
    </form>
  `;
}

function renderMain() {
  return `
    <div class="main-shell">
      <header class="topbar">
        <div>
          <h1 class="main-title">个人文件中心</h1>
          <p class="subtitle">${escapeHtml(getDisplayName())}</p>
        </div>
        <button id="logout-button" class="btn-ghost" type="button">退出</button>
      </header>

      <div class="panels">
        <section class="panel">
          <div class="panel-body">
            <div class="section-head">
              <h2 class="section-title">上传文件</h2>
              <button id="pick-files-button" class="btn-ghost" type="button">选择文件</button>
            </div>
            <p class="muted">单文件上限 ${formatBytes(config.maxFileSize)}</p>
            <input id="fallback-file-input" class="hidden-input" type="file" multiple />
            ${renderSelectedFiles()}
            <div style="margin-top:14px;">
              <button id="upload-button" class="btn" type="button" ${state.uploading || !state.selectedFiles.length ? "disabled" : ""}>${state.uploading ? "上传中…" : "开始上传"}</button>
            </div>
            ${state.uploadTasks.length ? `<div class="task-list">${state.uploadTasks.map(renderTask).join("")}</div>` : ""}
          </div>
        </section>

        <section class="panel">
          <div class="panel-body">
            <div class="section-head">
              <h2 class="section-title">文件列表</h2>
              <button id="refresh-files-button" class="btn-ghost" type="button">刷新</button>
            </div>
            ${state.loadingFiles ? '<div class="muted">正在加载文件…</div>' : renderFileList()}
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderSelectedFiles() {
  if (!state.selectedFiles.length) {
    return `
      <div class="picker-box" style="margin-top:14px;">
        <p class="file-empty">还没有选择文件。</p>
      </div>
    `;
  }

  return `
    <div class="selected-list">
      ${state.selectedFiles.map((file, index) => `
        <div class="selected-file">
          <div>
            <div class="selected-name">${escapeHtml(file.name)}</div>
            <div class="file-meta">${formatBytes(file.size)}</div>
          </div>
          <button class="btn-danger" type="button" data-remove-selected="${index}">移除</button>
        </div>
      `).join("")}
    </div>
  `;
}

function renderTask(task) {
  return `
    <div class="task-item">
      <div class="task-top">
        <strong>${escapeHtml(task.name)}</strong>
        <span>${escapeHtml(task.status)}</span>
      </div>
      <div class="task-detail">${escapeHtml(task.detail || "处理中")}</div>
    </div>
  `;
}

function renderFileList() {
  if (!state.files.length) {
    return '<div class="file-empty">还没有文件。</div>';
  }

  return `
    <div class="file-list">
      ${state.files.map((file) => `
        <div class="file-item">
          <div class="file-top">
            <div>
              <div class="file-name">${escapeHtml(file.file_name)}</div>
              <div class="file-meta">${formatBytes(file.file_size)} · ${escapeHtml(formatDate(file.created_at))}</div>
            </div>
          </div>
          <div class="file-actions" style="margin-top:12px;">
            <button class="btn-ghost" type="button" data-download-id="${file.id}" ${state.downloadingId === file.id ? "disabled" : ""}>${state.downloadingId === file.id ? "处理中…" : "下载"}</button>
            <button class="btn-danger" type="button" data-delete-id="${file.id}" ${state.deletingId === file.id ? "disabled" : ""}>${state.deletingId === file.id ? "删除中…" : "删除"}</button>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function bindEvents() {
  document.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      state.authMode = button.getAttribute("data-auth-mode");
      render();
    });
  });

  document.getElementById("login-form")?.addEventListener("submit", handleLogin);
  document.getElementById("register-form")?.addEventListener("submit", handleRegister);
  document.getElementById("logout-button")?.addEventListener("click", handleLogout);
  document.getElementById("pick-files-button")?.addEventListener("click", handlePickFiles);
  document.getElementById("upload-button")?.addEventListener("click", handleUpload);
  document.getElementById("refresh-files-button")?.addEventListener("click", refreshUserData);
  document.getElementById("fallback-file-input")?.addEventListener("change", handleFallbackInputChange);

  document.querySelectorAll("[data-remove-selected]").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.getAttribute("data-remove-selected"));
      state.selectedFiles.splice(index, 1);
      render();
    });
  });

  document.querySelectorAll("[data-download-id]").forEach((button) => {
    button.addEventListener("click", () => handleDownload(button.getAttribute("data-download-id")));
  });

  document.querySelectorAll("[data-delete-id]").forEach((button) => {
    button.addEventListener("click", () => handleDelete(button.getAttribute("data-delete-id")));
  });
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const account = String(formData.get("account") || "").trim();
  const password = String(formData.get("password") || "");

  if (!account || !password) {
    showToast("请输入用户名和密码。", "error");
    return;
  }

  state.authSubmitting = true;
  render();

  try {
    const email = isEmailLike(account) ? account : usernameToEmail(account);
    const result = await withTimeout(state.supabase.auth.signInWithPassword({ email, password }), 15000, "登录超时，请重试。");
    if (result.error) throw result.error;
    showToast("登录成功。", "success");
  } catch (error) {
    showToast(error.message || "登录失败。", "error");
  } finally {
    state.authSubmitting = false;
    render();
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username) {
    showToast("请输入用户名。", "error");
    return;
  }

  if (password.length < 6) {
    showToast("密码至少 6 位。", "error");
    return;
  }

  state.authSubmitting = true;
  render();

  try {
    const result = await withTimeout(
      state.supabase.auth.signUp({
        email: usernameToEmail(username),
        password,
        options: {
          data: {
            full_name: username,
            username
          }
        }
      }),
      15000,
      "注册超时，请重试。"
    );

    if (result.error) throw result.error;
    if (result.data.session) {
      showToast("注册并登录成功。", "success");
    } else {
      state.authMode = "login";
      showToast("注册成功，请登录。", "success");
    }
  } catch (error) {
    showToast(error.message || "注册失败。", "error");
  } finally {
    state.authSubmitting = false;
    render();
  }
}

async function handleLogout() {
  try {
    await withTimeout(state.supabase.auth.signOut({ scope: "local" }), 5000, "退出超时");
  } catch {
  }

  state.session = null;
  state.user = null;
  state.profile = null;
  state.files = [];
  state.selectedFiles = [];
  state.uploadTasks = [];
  render();
  showToast("已退出。", "info");
}

function handleFallbackInputChange(event) {
  const files = Array.from(event.target.files || []).map((file) => ({
    name: file.name,
    size: file.size,
    type: file.type || "application/octet-stream",
    blob: file
  }));
  state.selectedFiles = files;
  render();
}

async function handlePickFiles() {
  try {
    if (nativeFilePicker?.pickFiles) {
      const result = await withTimeout(
        nativeFilePicker.pickFiles({
          types: Object.keys(ALLOWED_MIME_TYPES)
        }),
        20000,
        "选择文件超时，请重试。"
      );

      state.selectedFiles = (result.files || []).map(mapNativePickedFile);
      render();
      return;
    }

    const fallbackInput = document.getElementById("fallback-file-input");
    fallbackInput?.click();
  } catch (error) {
    showToast(error.message || "选择文件失败。", "error");
  }
}

async function getAccessToken() {
  const result = await withTimeout(state.supabase.auth.getSession(), 8000, "读取登录状态超时。");
  const session = result.data?.session || state.session;
  if (!session?.access_token) {
    throw new Error("登录状态已失效，请重新登录。");
  }
  return session.access_token;
}

async function uploadToStorage(filePath, file) {
  const accessToken = await getAccessToken();
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 45000);

  try {
    const body = await file.blob.arrayBuffer();
    const encodedBucket = encodeURIComponent(config.storageBucket);
    const encodedPath = filePath.split("/").map((part) => encodeURIComponent(part)).join("/");
    const response = await fetch(`${config.supabaseUrl}/storage/v1/object/${encodedBucket}/${encodedPath}`, {
      method: "POST",
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "false"
      },
      body,
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text();
      let message = "上传失败";
      try {
        const parsed = JSON.parse(text);
        message = parsed.message || parsed.error || message;
      } catch {
        if (text) message = text;
      }
      throw new Error(message);
    }
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("上传超时，请检查网络后重试。");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleUpload() {
  if (!state.selectedFiles.length) {
    showToast("请先选择文件。", "error");
    return;
  }

  if (!state.user?.id) {
    showToast("登录状态无效，请重新登录。", "error");
    return;
  }

  state.uploading = true;
  state.uploadTasks = state.selectedFiles.map((file, index) => ({
    id: `${file.name}-${file.size}-${index}`,
    name: file.name,
    status: "等待中",
    detail: "准备开始"
  }));
  render();

  let successCount = 0;
  let failureCount = 0;

  for (const [index, file] of state.selectedFiles.entries()) {
    const taskId = `${file.name}-${file.size}-${index}`;

    if (!validateFileType(file)) {
      updateTask(taskId, "失败", "文件类型不支持");
      failureCount += 1;
      continue;
    }

    if (!isFileSizeValid(file.size)) {
      updateTask(taskId, "失败", `文件不能超过 ${formatBytes(config.maxFileSize)}`);
      failureCount += 1;
      continue;
    }

    const filePath = buildStoragePath(state.user.id, file.name);

    try {
      updateTask(taskId, "上传中", "正在上传到存储");
      await uploadToStorage(filePath, file);

      updateTask(taskId, "登记中", "正在写入数据库");
      const insertResult = await withTimeout(
        state.supabase.from("files").insert({
          user_id: state.user.id,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type || "application/octet-stream"
        }),
        15000,
        "写入文件记录超时。"
      );

      if (insertResult.error) {
        await state.supabase.storage.from(config.storageBucket).remove([filePath]);
        throw insertResult.error;
      }

      updateTask(taskId, "完成", "上传成功");
      successCount += 1;
    } catch (error) {
      updateTask(taskId, "失败", error.message || "上传失败");
      failureCount += 1;
    }
  }

  state.uploading = false;
  state.selectedFiles = [];
  const fallbackInput = document.getElementById("fallback-file-input");
  if (fallbackInput) {
    fallbackInput.value = "";
  }
  render();
  refreshUserData();

  if (successCount > 0 && failureCount === 0) {
    showToast(`上传成功，共 ${successCount} 个。`, "success");
  } else if (successCount > 0) {
    showToast(`成功 ${successCount} 个，失败 ${failureCount} 个。`, "info");
  } else {
    showToast("上传失败。", "error");
  }
}

async function handleDownload(fileId) {
  const file = state.files.find((item) => item.id === fileId);
  if (!file) return;

  state.downloadingId = fileId;
  render();

  try {
    const result = await withTimeout(
      state.supabase.storage.from(config.storageBucket).createSignedUrl(file.file_path, 60, {
        download: file.file_name
      }),
      12000,
      "下载链接生成超时。"
    );

    if (result.error || !result.data?.signedUrl) {
      throw result.error || new Error("下载链接生成失败");
    }

    window.open(result.data.signedUrl, "_blank");
    showToast("已开始下载。", "success");
  } catch (error) {
    showToast(error.message || "下载失败。", "error");
  } finally {
    state.downloadingId = null;
    render();
  }
}

async function handleDelete(fileId) {
  const file = state.files.find((item) => item.id === fileId);
  if (!file || !state.user?.id) return;

  if (!window.confirm(`确定删除 ${file.file_name} 吗？`)) {
    return;
  }

  state.deletingId = fileId;
  render();

  try {
    const storageResult = await withTimeout(
      state.supabase.storage.from(config.storageBucket).remove([file.file_path]),
      12000,
      "删除文件超时。"
    );
    if (storageResult.error) throw storageResult.error;

    const deleteResult = await withTimeout(
      state.supabase.from("files").delete().eq("id", file.id).eq("user_id", state.user.id),
      12000,
      "删除记录超时。"
    );
    if (deleteResult.error) throw deleteResult.error;

    showToast("删除成功。", "success");
    refreshUserData();
  } catch (error) {
    showToast(error.message || "删除失败。", "error");
  } finally {
    state.deletingId = null;
    render();
  }
}

async function refreshUserData() {
  if (!state.session) return;

  state.loadingFiles = true;
  render();

  try {
    const userResult = await withTimeout(state.supabase.auth.getUser(), 10000, "读取用户超时。");
    const user = userResult.data?.user;
    if (userResult.error || !user) {
      throw userResult.error || new Error("登录状态失效");
    }

    state.user = user;

    const [profileResult, filesResult] = await withTimeout(
      Promise.all([
        state.supabase.from("users").select("id, email, full_name, created_at").eq("id", user.id).single(),
        state.supabase.from("files").select("id, user_id, file_name, file_path, file_size, mime_type, created_at").eq("user_id", user.id).order("created_at", { ascending: false })
      ]),
      15000,
      "刷新文件列表超时。"
    );

    state.profile = profileResult.data || null;
    state.files = filesResult.data || [];
  } catch (error) {
    showToast(error.message || "加载文件失败。", "error");
  } finally {
    state.loadingFiles = false;
    render();
  }
}

async function init() {
  if (!config.supabaseUrl || !config.supabaseAnonKey || !supabaseFactory?.createClient) {
    render();
    return;
  }

  state.supabase = supabaseFactory.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      storageKey: "personal-file-center-mobile-auth"
    }
  });

  const sessionResult = await withTimeout(state.supabase.auth.getSession(), 10000, "初始化超时。");
  state.session = sessionResult.data?.session || null;
  state.user = state.session?.user || null;

  state.supabase.auth.onAuthStateChange((_, session) => {
    state.session = session;
    state.user = session?.user || null;
    if (session) {
      refreshUserData();
    } else {
      state.profile = null;
      state.files = [];
      state.selectedFiles = [];
      state.uploadTasks = [];
      render();
    }
  });

  if (state.session) {
    refreshUserData();
  } else {
    render();
  }
}

init();
