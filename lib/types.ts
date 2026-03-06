export type DatabaseUser = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
};

export type FileRecord = {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
};
