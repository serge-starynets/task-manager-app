export type AttachmentDto = {
  id: number;
  taskId: number;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  url: string;
  pathname: string;
  uploadedBy: string;
  createdAt: string;
};
