using System;
using System.IO;
using System.Threading.Tasks;

namespace CRM.Infrastructure.Services
{
    /// <summary>
    /// Local file storage service. Replace with S3/Azure Blob in production.
    /// </summary>
    public class FileStorageService
    {
        private readonly string _uploadPath;

        public FileStorageService()
        {
            _uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
            if (!Directory.Exists(_uploadPath))
                Directory.CreateDirectory(_uploadPath);
        }

        public async Task<string> SaveFileAsync(Stream fileStream, string fileName)
        {
            var sanitizedExt = Path.GetExtension(fileName);
            var sanitizedName = Path.GetFileNameWithoutExtension(fileName).Replace("..", "").Replace("/", "").Replace("\\", "");
            var uniqueName = $"{Guid.NewGuid()}_{sanitizedName}{sanitizedExt}";
            var filePath = Path.Combine(_uploadPath, uniqueName);
            await using var fs = new FileStream(filePath, FileMode.Create);
            await fileStream.CopyToAsync(fs);
            return $"/uploads/{uniqueName}";
        }

        public Task DeleteFileAsync(string filePath)
        {
            var fullPath = Path.Combine(Directory.GetCurrentDirectory(), filePath.TrimStart('/'));
            if (File.Exists(fullPath))
                File.Delete(fullPath);
            return Task.CompletedTask;
        }
    }
}
