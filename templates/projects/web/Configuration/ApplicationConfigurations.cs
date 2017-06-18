using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AspNetCoreInjectConfigurationRazor.Configuration
{
    public class SiteSettings
    {
        public string ApplicationHostUrl { get; set; }
        public string SiteName { get; set; }
        public string SiteNameShort { get; set; }
        public string Support { get; set; }
        public List<ViewNoticeModel> tips { set; get; }
        public passwordOptions password_options { get; set; }
        public sessionOptions session_options { get; set; }
    }
    public class passwordOptions
    {
        public bool RequireDigit { get; set; }
        public bool RequireLowercase { get; set; }
        public bool RequireNonAlphanumeric { get; set; }
        public bool RequireUppercase { get; set; }
        public int RequiredLength { set; get; }
    }
    public class sessionOptions
    {
        public bool CookieHttpOnly { get; set; }
        public string CookieName { get; set; }
        public int IdleTimeout { get; set; }
    }
}
