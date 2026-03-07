package com.personalfilecenter.app;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Base64;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;

@CapacitorPlugin(name = "NativeFilePicker")
public class NativeFilePickerPlugin extends Plugin {
    @PluginMethod
    public void pickFiles(PluginCall call) {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("*/*");
        intent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true);

        JSArray types = call.getArray("types");
        if (types != null && types.length() > 0) {
            String[] mimeTypes = new String[types.length()];
            for (int index = 0; index < types.length(); index += 1) {
                mimeTypes[index] = types.optString(index, "*/*");
            }
            intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
        }

        startActivityForResult(call, intent, "handlePickFilesResult");
    }

    @ActivityCallback
    private void handlePickFilesResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
            call.reject("用户取消了选择文件");
            return;
        }

        Intent data = result.getData();
        JSArray files = new JSArray();

        try {
            if (data.getClipData() != null) {
                for (int index = 0; index < data.getClipData().getItemCount(); index += 1) {
                    Uri uri = data.getClipData().getItemAt(index).getUri();
                    files.put(buildFileObject(uri));
                }
            } else if (data.getData() != null) {
                files.put(buildFileObject(data.getData()));
            }
        } catch (Exception exception) {
            call.reject(exception.getMessage());
            return;
        }

        JSObject resultObject = new JSObject();
        resultObject.put("files", files);
        call.resolve(resultObject);
    }

    private JSObject buildFileObject(Uri uri) throws IOException {
        JSObject fileObject = new JSObject();
        String mimeType = getContext().getContentResolver().getType(uri);
        String name = "file";
        long size = 0L;

        Cursor cursor = getContext().getContentResolver().query(uri, null, null, null, null);
        if (cursor != null) {
            int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
            int sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
            if (cursor.moveToFirst()) {
                if (nameIndex >= 0) {
                    name = cursor.getString(nameIndex);
                }
                if (sizeIndex >= 0) {
                    size = cursor.getLong(sizeIndex);
                }
            }
            cursor.close();
        }

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        InputStream inputStream = getContext().getContentResolver().openInputStream(uri);
        if (inputStream == null) {
            throw new IOException("无法读取文件");
        }

        byte[] buffer = new byte[8192];
        int length;
        while ((length = inputStream.read(buffer)) != -1) {
            outputStream.write(buffer, 0, length);
        }
        inputStream.close();

        byte[] data = outputStream.toByteArray();
        if (size <= 0L) {
            size = data.length;
        }

        fileObject.put("name", name);
        fileObject.put("size", size);
        fileObject.put("mimeType", mimeType != null ? mimeType : "application/octet-stream");
        fileObject.put("data", Base64.encodeToString(data, Base64.NO_WRAP));
        return fileObject;
    }
}