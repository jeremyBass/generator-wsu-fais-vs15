using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AspNetCoreInjectConfigurationRazor.Configuration
{
    public class ApplicationConfigurations
    {
        public string ApplicationHostUrl { get; set; }
        public string SiteName { get; set; }
        public string SiteNameShort { get; set; }
    }
}
