using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;

namespace <%= namespace %>.Models
{
    // Add profile data for application users by adding properties to the ApplicationUser class
    public class ApplicationUser : IdentityUser
    {
        public string FirstName { get; set; }

        public string LastName { get; set; }

        public string FullName { get { return String.IsNullOrEmpty(FirstName) && String.IsNullOrEmpty(FirstName) ? Email : string.Format("{0} {1}", FirstName, LastName); } }
    }
}
