using CRM.Application.Features.KnowledgeBase.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace CRM.Application.Common.Interfaces
{
    public interface IKnowledgeBaseService
    {
        Task<IReadOnlyList<ArticleCategoryDto>> GetAllCategoriesAsync();
        Task<ArticleCategoryDto> CreateCategoryAsync(CreateArticleCategoryDto dto);
        Task UpdateCategoryAsync(Guid id, UpdateArticleCategoryDto dto);
        Task DeleteCategoryAsync(Guid id);

        Task<IReadOnlyList<ArticleDto>> GetPagedArticlesAsync(int pageNumber, int pageSize, bool publicOnly = false);
        Task<ArticleDto?> GetArticleByIdAsync(Guid id);
        Task<ArticleDto> CreateArticleAsync(CreateArticleDto dto, Guid authorId);
        Task UpdateArticleAsync(Guid id, UpdateArticleDto dto, Guid currentUserId);
        Task DeleteArticleAsync(Guid id);
        Task IncrementViewCountAsync(Guid id);
    }
}
