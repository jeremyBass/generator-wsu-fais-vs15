using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace <%= namespace %>.Models.UI
{
    public class ViewNoticeModel
    {
        public string title { set; get; }
        public string level { set; get; }
        public string message { set; get; }
        public string code { set; get; }
        public string support { set; get; } // do the default here, but pull it from the settings.. hook it up good here
    }
}
