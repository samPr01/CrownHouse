"use client";

const ContactInfo = () => {
  return (
    <div className="flex flex-col md:gap-12 gap-8 text-center md:text-left">
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-left-10 duration-1000 ease-in-out fill-mode-both">
        <div className="flex gap-3 items-center justify-center md:justify-start">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <p className="text-base font-normal text-muted-foreground">
            We can help
          </p>
        </div>
        <p className="text-3xl  md:text-4xl font-medium text-foreground">
          We’re here to help you find your perfect style and answer any questions.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row justify-between gap-6 animate-in fade-in slide-in-from-left-10 duration-1000 delay-100 ease-in-out fill-mode-both">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-normal text-muted-foreground">Phone</p>
          <a
            href="tel:+917616021755"
            className="break-words text-base font-medium text-primary"
          >
            +917616021755
          </a>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-normal text-muted-foreground">Email</p>
          <a
            href="mailto:Ecomcrownsolutions@gmail.com"
            className="break-words text-base font-medium text-primary"
          >
            Ecomcrownsolutions@gmail.com
          </a>
        </div>
      </div>
      <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-left-10 duration-1000 delay-100 ease-in-out fill-mode-both">
        <p className="text-sm font-normal text-muted-foreground">Location</p>
        <p className="break-words text-base font-medium text-primary">
          213, Diamond Trade Centre New Palasia Indore 452001 MP
        </p>
      </div>

    </div>
  );
};

export default ContactInfo;
