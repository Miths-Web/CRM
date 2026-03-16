using System;
using System.Net;

namespace CRM.Application.Common.Exceptions
{
    /// <summary>Thrown when a requested entity is not found in the database. Returns HTTP 404.</summary>
    public class NotFoundException : Exception
    {
        public NotFoundException(string name, object key)
            : base($"'{name}' with key '{key}' was not found.") { }

        public NotFoundException(string message) : base(message) { }
    }

    /// <summary>Thrown when a business rule is violated (e.g. duplicate email). Returns HTTP 400.</summary>
    public class BusinessException : Exception
    {
        public BusinessException(string message) : base(message) { }
    }

    /// <summary>Thrown when an operation is not allowed for the current user. Returns HTTP 403.</summary>
    public class ForbiddenException : Exception
    {
        public ForbiddenException(string message = "You do not have permission to perform this action.")
            : base(message) { }
    }

    /// <summary>Thrown when a request is invalid (bad data). Returns HTTP 422.</summary>
    public class ValidationException : Exception
    {
        public ValidationException(string message) : base(message) { }
    }

    /// <summary>Thrown when there is a conflict (e.g. concurrency issue). Returns HTTP 409.</summary>
    public class ConflictException : Exception
    {
        public ConflictException(string message) : base(message) { }
    }
}
