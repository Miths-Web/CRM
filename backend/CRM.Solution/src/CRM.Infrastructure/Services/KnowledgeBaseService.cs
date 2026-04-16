using CRM.Application.Common.Exceptions;
using CRM.Application.Common.Interfaces;
using CRM.Application.Features.KnowledgeBase.DTOs;
using CRM.Domain.Entities;
using CRM.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace CRM.Infrastructure.Services
{
    public class KnowledgeBaseService : IKnowledgeBaseService
    {
        private readonly ApplicationDbContext _context;

        public KnowledgeBaseService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IReadOnlyList<ArticleCategoryDto>> GetAllCategoriesAsync()
        {
            var cats = await _context.ArticleCategories.OrderBy(c => c.Name).ToListAsync();
            return cats.Select(c => new ArticleCategoryDto
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            }).ToList();
        }

        public async Task<ArticleCategoryDto> CreateCategoryAsync(CreateArticleCategoryDto dto)
        {
            var cat = new ArticleCategory
            {
                Name = dto.Name,
                Description = dto.Description,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.ArticleCategories.Add(cat);
            await _context.SaveChangesAsync();

            return new ArticleCategoryDto
            {
                Id = cat.Id,
                Name = cat.Name,
                Description = cat.Description,
                CreatedAt = cat.CreatedAt,
                UpdatedAt = cat.UpdatedAt
            };
        }

        public async Task UpdateCategoryAsync(Guid id, UpdateArticleCategoryDto dto)
        {
            var cat = await _context.ArticleCategories.FindAsync(id);
            if (cat == null) throw new NotFoundException("Category not found");

            cat.Name = dto.Name;
            cat.Description = dto.Description;
            cat.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task DeleteCategoryAsync(Guid id)
        {
            var cat = await _context.ArticleCategories.FindAsync(id);
            if (cat != null)
            {
                _context.ArticleCategories.Remove(cat);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<IReadOnlyList<ArticleDto>> GetPagedArticlesAsync(int pageNumber, int pageSize, bool publicOnly = false)
        {
            var query = _context.Articles
                .Include(a => a.Category)
                .Include(a => a.Author)
                .AsQueryable();

            if (publicOnly)
            {
                query = query.Where(a => a.IsPublished);
            }

            var articles = await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return articles.Select(MapToDto).ToList();
        }

        public async Task<ArticleDto?> GetArticleByIdAsync(Guid id)
        {
            var article = await _context.Articles
                .Include(a => a.Category)
                .Include(a => a.Author)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (article == null) return null;
            return MapToDto(article);
        }

        public async Task<ArticleDto> CreateArticleAsync(CreateArticleDto dto, Guid authorId)
        {
            var article = new Article
            {
                CategoryId = dto.CategoryId,
                Title = dto.Title,
                Content = dto.Content,
                Tags = dto.Tags,
                AuthorId = authorId,
                IsPublished = dto.IsPublished,
                ViewCount = 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Articles.Add(article);
            await _context.SaveChangesAsync();

            return await GetArticleByIdAsync(article.Id) ?? MapToDto(article);
        }

        public async Task UpdateArticleAsync(Guid id, UpdateArticleDto dto, Guid currentUserId)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) throw new NotFoundException("Article not found");

            article.CategoryId = dto.CategoryId;
            article.Title = dto.Title;
            article.Content = dto.Content;
            article.Tags = dto.Tags;
            article.IsPublished = dto.IsPublished;
            article.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task DeleteArticleAsync(Guid id)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article != null)
            {
                _context.Articles.Remove(article);
                await _context.SaveChangesAsync();
            }
        }

        public async Task IncrementViewCountAsync(Guid id)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article != null)
            {
                article.ViewCount += 1;
                await _context.SaveChangesAsync();
            }
        }

        private ArticleDto MapToDto(Article a)
        {
            return new ArticleDto
            {
                Id = a.Id,
                CategoryId = a.CategoryId,
                CategoryName = a.Category?.Name,
                Title = a.Title,
                Content = a.Content,
                Tags = a.Tags,
                AuthorId = a.AuthorId,
                AuthorName = a.Author != null ? $"{a.Author.FirstName} {a.Author.LastName}" : null,
                IsPublished = a.IsPublished,
                ViewCount = a.ViewCount,
                CreatedAt = a.CreatedAt,
                UpdatedAt = a.UpdatedAt
            };
        }
    }
}
