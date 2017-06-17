using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using <%= namespace %>.Data;
using <%= namespace %>.Models;
using <%= namespace %>.Services;
using Microsoft.AspNetCore.Identity;
using DataTables.AspNet.AspNetCore;
using Microsoft.AspNetCore.Session;
using Microsoft.AspNetCore.ResponseCompression;
using System.IO.Compression;
using Microsoft.AspNetCore.Mvc;
using AspNetCoreInjectConfigurationRazor.Configuration;
// <%= features %>
// <%= features.join(',') %>
// <%= features.indexOf("cors") > -1 %>
// <%= features["all"] %>
<% if (features.indexOf("cors") > -1 || features.indexOf("all") > -1 ) { %>
using Microsoft.AspNetCore.Mvc.Cors.Internal;
<% } %>
<% if (features.indexOf("swagger") > -1 || features.indexOf("all") > -1 ) { %>
using Swashbuckle.AspNetCore.Swagger;
using Microsoft.Extensions.PlatformAbstractions;
using System.IO;
<% } %>
using Microsoft.AspNetCore.Mvc.Razor;

namespace <%= namespace %>
{
    public class ViewLocationExpander : IViewLocationExpander
    {
        public void PopulateValues(ViewLocationExpanderContext context) {}

        public IEnumerable<string> ExpandViewLocations(ViewLocationExpanderContext context, IEnumerable<string> viewLocations)
        {
            return new[]
            {
                "/Theme/Views/{1}/{0}.cshtml",
                "/Theme/Views/Shared/{0}.cshtml"
            }.Union(viewLocations);
        }
    }
    public class Startup
    {
        public Startup(IHostingEnvironment env)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(env.ContentRootPath)
                .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
                .AddJsonFile($"appsettings.{env.EnvironmentName}.json", optional: true);

            if (env.IsDevelopment())
            {
                // For more details on using the user secret store see https://go.microsoft.com/fwlink/?LinkID=532709
                builder.AddUserSecrets();
            }

            builder.AddEnvironmentVariables();
            Configuration = builder.Build();
        }

        public IConfigurationRoot Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        public void ConfigureServices(IServiceCollection services)
        {

            services.Configure<ApplicationConfigurations>(Configuration.GetSection("ApplicationConfigurations"));
            services.Configure<RazorViewEngineOptions>(options =>
            {
                options.ViewLocationExpanders.Add(new ViewLocationExpander());
            });
            // Add framework services.
            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(Configuration.GetConnectionString("DefaultConnection")));

            services.AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequiredLength = 4;
            })
                .AddEntityFrameworkStores<ApplicationDbContext>()
                .AddDefaultTokenProviders();



            services.AddRouting(options => options.LowercaseUrls = true);

            services.AddMvc();
            services.AddDistributedMemoryCache();

            services.AddSession(options =>
            {
                options.CookieHttpOnly = true;
                options.CookieName = ".notices";
                options.IdleTimeout = TimeSpan.FromSeconds(10);
            });

            <% if (features.indexOf("cors") > -1 || features.indexOf("all") > -1 ) { %>
            services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader().AllowCredentials());
            });
            services.Configure<MvcOptions>(options =>
            {
                options.Filters.Add(new CorsAuthorizationFilterFactory("AllowAll"));
            });
            <% } %>

            services.RegisterDataTables();
            // Add application services.
            services.AddTransient<IEmailSender, AuthMessageSender>();
            services.AddTransient<ISmsSender, AuthMessageSender>();
            <% if (features.indexOf("swagger") > -1 || features.indexOf("all") > -1 ) { %>
                // Register the Swagger generator, defining one or more Swagger documents
                services.AddSwaggerGen(c =>
                {
                    c.SwaggerDoc("v1", new Info
                    {
                        Version = "v1",
                        Title = "WSU HTTP API",
                        Description = "This service exposes common services needed for WSU infastructures.  Only public services will be freely listed, although they could still meet with locks.  Seek help from FAIS for services not listed.",
                        TermsOfService = "None",
                        Contact = new Contact { Name = "Jeremy Bass", Email = "jeremy.bass@wsu.edu", Url = "https://fais.wp.wsu.edu" },
                        License = new License { Name = "NOTYOURS", Url = "if you are not whitelisted you just can't" }
                    });
                    //Set the comments path for the swagger json and ui.
                    var basePath = PlatformServices.Default.Application.ApplicationBasePath;
                    var xmlPath = Path.Combine(basePath, "<%= namespace %>.xml");
                    c.IncludeXmlComments(xmlPath);
                });
            <% } %>


        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            loggerFactory.AddConsole(Configuration.GetSection("Logging"));
            loggerFactory.AddDebug();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseDatabaseErrorPage();
                app.UseBrowserLink();
            }
            else
            {
                app.UseExceptionHandler("/Home/Error");
            }
            app.UseIdentity();

            <% if (features.indexOf("swagger") > -1 || features.indexOf("all") > -1 ) { %>
            app.UseDefaultFiles();
            <% } %>

            app.UseStaticFiles();



            // Add external authentication middleware below. To configure them please see https://go.microsoft.com/fwlink/?LinkID=532715
            app.UseSession();

            <% if (features.indexOf("swagger") > -1 || features.indexOf("all") > -1 ) { %>
            // Enable middleware to serve generated Swagger as a JSON endpoint.
            app.UseSwagger();

            // Enable middleware to serve swagger-ui (HTML, JS, CSS etc.), specifying the Swagger JSON endpoint.
            app.UseSwaggerUI(c =>
            {
                c.RoutePrefix = "docs";
                //c.SwaggerEndpoint("/docs/v1/wsu_restful.json", "v1.0.0");swagger
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "v1");
            });
            <% } %>

            app.UseMvc(routes =>
            {
                routes.MapRoute(
                    name: "default",
                    template: "{controller=Home}/{action=Index}/{id?}");
            });
        }
    }
}
