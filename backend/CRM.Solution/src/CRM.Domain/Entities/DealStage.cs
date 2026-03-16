using System.Collections.Generic;

namespace CRM.Domain.Entities
{
    public class DealStage
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int OrderIndex { get; set; }
        public int Probability { get; set; }
        public bool IsActive { get; set; } = true;

        public ICollection<Deal> Deals { get; set; } = new List<Deal>();
    }
}
