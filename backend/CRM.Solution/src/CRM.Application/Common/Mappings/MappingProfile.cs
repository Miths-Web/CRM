using AutoMapper;
using CRM.Application.Features.Leads.DTOs;
using CRM.Application.Features.Deals.DTOs;
using CRM.Application.Features.Tasks.DTOs;
using CRM.Application.Features.Events.DTOs;
using CRM.Application.Features.Notes.DTOs;
using CRM.Application.Features.Documents.DTOs;
using CRM.Application.Features.Emails.DTOs;
using CRM.Domain.Entities;
using TaskStatus = CRM.Domain.Enums.TaskStatus;

namespace CRM.Application.Common.Mappings
{
    /// <summary>
    /// Central AutoMapper profile. Maps Domain Entities <-> DTOs.
    /// This removes the manual MapToDto() methods from every service.
    /// </summary>
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // Lead
            CreateMap<Lead, LeadDto>();
            CreateMap<CreateLeadDto, Lead>();

            // Deal
            CreateMap<Deal, DealDto>()
                .ForMember(d => d.StageName, opt => opt.MapFrom(src => src.Stage != null ? src.Stage.Name : null));
            CreateMap<CreateDealDto, Deal>();
            CreateMap<DealStage, DealStageDto>();

            // Task
            CreateMap<CrmTask, TaskDto>();
            CreateMap<CreateTaskDto, CrmTask>();

            // Event
            CreateMap<Event, EventDto>();
            CreateMap<CreateEventDto, Event>();

            // Note
            CreateMap<Note, NoteDto>();
            CreateMap<CreateNoteDto, Note>();

            // Document
            CreateMap<Document, DocumentDto>();

            // Email
            CreateMap<Email, EmailDto>();
            CreateMap<CreateEmailDto, Email>();
        }
    }
}
