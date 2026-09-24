module.exports = `
  :root{
    --violet:#1E1035;
    --violet-deep:#150a28;
    --panel:#241640;
    --panel-2:#2c1a4d;
    --line:rgba(255,255,255,0.12);
    --white:#FFFFFF;
    --dim:rgba(255,255,255,0.68);
    --magenta:#FF2E93;
    --magenta-deep:#c81f70;
    --teal:#00F5D4;
    color-scheme: dark;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;padding:0;}
  body{
    background:var(--violet);color:var(--white);font-family:'Poppins',sans-serif;
    -webkit-font-smoothing:antialiased;overflow-x:hidden;
    padding-left:max(20px, env(safe-area-inset-left,0px));
    padding-right:max(20px, env(safe-area-inset-right,0px));
  }
  a{color:inherit;text-decoration:none;}
  .display{font-family:'Fredoka',sans-serif;font-weight:600;line-height:1.06;text-wrap:balance;}
  .mono{font-family:'IBM Plex Mono',ui-monospace,monospace;}
  .wrap{max-width:1120px;margin:0 auto;}
  .rule{height:1px;background:var(--line);width:100%;}
  .eyebrow{font-family:'IBM Plex Mono',monospace;color:var(--teal);font-weight:600;font-size:12.5px;letter-spacing:0.14em;text-transform:uppercase;}
  :root{ scroll-behavior:smooth; }
  @media (prefers-reduced-motion:reduce){ :root{scroll-behavior:auto;} }
  .logo-icon{display:block;width:100%;height:100%;}

  nav{
    position:sticky;top:0;z-index:60;margin:0 -20px;padding:0 20px;
    background:rgba(21,10,40,0.82);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
    border-bottom:1px solid var(--line);
  }
  .nav-inner{max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:66px;gap:18px;}
  .brand{display:flex;align-items:center;gap:10px;}
  .brand .logo-icon-wrap{width:34px;height:34px;flex-shrink:0;}
  .brand-text{display:flex;flex-direction:column;line-height:1.1;}
  .brand-name{font-family:'Fredoka',sans-serif;font-weight:700;font-size:17px;letter-spacing:0.01em;color:var(--white);}
  .brand-sub{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:0.16em;text-transform:uppercase;color:var(--teal);margin-top:1px;}
  .nav-links{display:flex;gap:22px;font-size:13.5px;font-weight:600;}
  .nav-links a{color:var(--dim);transition:color .2s;white-space:nowrap;}
  .nav-links a:hover,.nav-links a:focus-visible{color:var(--white);}
  .nav-right{display:flex;align-items:center;gap:14px;}
  .nav-toggle{
    display:none;background:none;border:none;cursor:pointer;padding:6px;
    align-items:center;justify-content:center;color:var(--white);
  }
  .nav-toggle svg{width:22px;height:22px;display:block;}
  @media (max-width:760px){
    .nav-toggle{display:flex;}
    .nav-links{
      display:none;flex-direction:column;gap:0;
      position:absolute;top:100%;left:0;right:0;
      background:var(--violet-deep);border-bottom:1px solid var(--line);
      padding:6px 20px 14px;
      box-shadow:0 16px 30px rgba(0,0,0,0.35);
    }
    .nav-links.mobile-open{display:flex;}
    .nav-links a{padding:13px 0;border-bottom:1px solid var(--line);}
    .nav-links a:last-child{border-bottom:none;}
  }

  .btn{display:inline-block;padding:13px 24px;font-weight:700;font-size:13.5px;border-radius:999px;font-family:'Poppins',sans-serif;border:2px solid transparent;transition:all .2s;white-space:nowrap;}
  .btn.primary{background:var(--magenta);color:var(--white);box-shadow:0 8px 22px rgba(255,46,147,0.35);}
  .btn.primary:hover{background:var(--magenta-deep);transform:translateY(-1px);}
  .btn.small{padding:10px 18px;font-size:12.5px;}

  .page-head{padding:56px 0 20px;}
  .page-head .display{font-size:clamp(30px,4.6vw,50px);color:var(--white);}
  .page-head p{color:var(--dim);margin-top:14px;font-size:15.5px;line-height:1.65;max-width:74ch;}
  .data-note{
    margin-top:22px;border:1px solid var(--line);background:var(--panel);border-radius:16px;
    padding:16px 20px;font-size:13px;color:var(--dim);line-height:1.6;
  }
  .data-note strong{color:var(--teal);}

  .county-nav{display:flex;gap:10px;flex-wrap:wrap;margin:28px 0 6px;}
  .county-pill{border:1.5px solid var(--teal);color:var(--teal);border-radius:999px;padding:8px 16px;font-size:12.5px;font-weight:700;font-family:'IBM Plex Mono',monospace;letter-spacing:0.03em;}
  .county-pill:hover{background:var(--teal);color:var(--violet-deep);}

  section.county{padding:52px 0;}
  .county-head{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin-bottom:8px;}
  .county-head .display{font-size:clamp(24px,3.4vw,34px);color:var(--white);}
  .county-count{font-family:'IBM Plex Mono',monospace;color:var(--dim);font-size:13px;}
  .county-intro{color:var(--dim);font-size:14px;margin-bottom:30px;max-width:70ch;}

  .school-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
  @media (max-width:980px){ .school-grid{grid-template-columns:repeat(2,1fr);} }
  @media (max-width:640px){ .school-grid{grid-template-columns:1fr;} }
  .school-card{border:1px solid var(--line);background:var(--panel);border-radius:16px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;}
  .school-card.has-live{border-color:var(--teal);box-shadow:0 0 30px rgba(0,245,212,0.12);flex-direction:column;align-items:flex-start;}
  .school-name{font-family:'Fredoka',sans-serif;font-size:15.5px;font-weight:600;color:var(--white);}
  .school-link{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--teal);white-space:nowrap;flex-shrink:0;}
  .school-link:hover{color:var(--white);}
  .live-block{margin-top:14px;padding-top:14px;border-top:1px solid var(--line);width:100%;}
  .live-block a{color:var(--teal);font-weight:700;font-size:14px;display:block;margin-top:8px;}
  .live-block a:hover{color:var(--white);}

  footer{padding:56px 0 46px;border-top:1px solid var(--line);}
  .foot-bottom{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;color:var(--dim);font-size:12.5px;}
  :focus-visible{outline:2px solid var(--teal);outline-offset:2px;}
`;
