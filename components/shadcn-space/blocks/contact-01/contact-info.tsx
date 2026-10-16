"use client"

const ContactInfo = () => {
  return (
    <div className="flex flex-col gap-8 text-center md:gap-12 md:text-left">
      <div className="flex animate-in flex-col gap-6 duration-1000 ease-in-out fill-mode-both slide-in-from-left-10 fade-in">
        <div className="flex items-center justify-center gap-3 md:justify-start">
          <div className="h-2 w-2 rounded-full bg-primary"></div>
          <p className="text-base font-normal text-muted-foreground">
            We can help
          </p>
        </div>
        <p className="text-3xl font-medium text-foreground md:text-4xl">
          We’re here to help you find your perfect style and answer any
          questions.
        </p>
      </div>
      <div className="flex animate-in flex-col justify-between gap-6 delay-100 duration-1000 ease-in-out fill-mode-both slide-in-from-left-10 fade-in sm:flex-row">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-normal text-muted-foreground">Phone</p>
          <a
            href="tel:+919232133533"
            className="text-base font-medium break-words text-primary"
          >
            +919232133533
          </a>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-normal text-muted-foreground">Email</p>
          <a
            href="mailto:hello@crownhouse.in"
            className="text-base font-medium break-words text-primary"
          >
            hello@crownhouse.in
          </a>
        </div>
      </div>
      <div className="flex animate-in flex-col gap-1 delay-100 duration-1000 ease-in-out fill-mode-both slide-in-from-left-10 fade-in">
        <p className="text-sm font-normal text-muted-foreground">Location</p>
        <p className="text-base font-medium break-words text-primary">
          213, Diamond Trade Centre New Palasia Indore 452001 MP
        </p>
      </div>
    </div>
  )
}

export default ContactInfo
