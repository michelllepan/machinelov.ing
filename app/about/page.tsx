"use client";

export default function AboutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-md">
        <button
          onClick={() => window.location.href = "/"}
          className="border-2 border-current rounded-lg bg-transparent hover:-translate-y-0.5 hover:bg-[#FFCFB0] transition-all duration-200"
          style={{ padding: "6px 10px", lineHeight: "1.2", whiteSpace: "pre", cursor: "pointer" }}
        >
          back
        </button>
        
        <br/>
        <br/>

        <p className="mb-4">
          website created by michelle pan.
        </p>
        <p>
          valentines contributed by
          amos you,
          arjun banerjee,
          chloe wen,  
          christina farhat,  
          danica xiong,  
          dhruv gautam,  
          emma guo,  
          eshaan moorjani,  
          gaurav tyagi,  
          jennifer zhao,  
          jenn grannen,
          jimmy li,  
          john so,  
          kaylee george,  
          kiran suresh,  
          konwoo kim,  
          lillian weng,  
          matthew lee,  
          max du,  
          mehul raheja,  
          melissa pan,  
          riley peterlinz,  
          ryan zhao,  
          sebastian zhao,  
          shiny weng,  
          simon guo,  
          suzanne nie,  
          tony xia,  
          viraj ramakrishnan, and
          will hu.
        </p>
      </div>
    </div>
  );
}
