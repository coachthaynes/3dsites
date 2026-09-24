module.exports = `
  :root{
    --black:#0a0a0a;
    --panel:#151515;
    --red:#d0202c;
    --red-dark:#8c0f18;
    --white:#f5f5f3;
    --line:#2a2a2a;
    --gray:#9a9a9a;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  html{scroll-behavior:smooth;}
  body{
    background:var(--black);
    color:var(--white);
    font-family:'Inter',sans-serif;
    -webkit-font-smoothing:antialiased;
    overflow-x:hidden;
  }
  .display{
    font-family:'Anton',sans-serif;
    text-transform:uppercase;
    letter-spacing:0.01em;
    line-height:0.98;
  }
  a{color:inherit;text-decoration:none;}
  .wrap{max-width:1100px;margin:0 auto;padding:0 28px;}
  .rule{height:1px;background:var(--line);width:100%;}

  nav{
    position:sticky;top:0;z-index:50;
    background:rgba(10,10,10,0.92);
    backdrop-filter:blur(6px);
    border-bottom:1px solid var(--line);
  }
  nav .wrap{
    display:flex;align-items:center;justify-content:space-between;
    height:64px;
  }
  .nav-name{font-family:'Anton',sans-serif;font-size:19px;letter-spacing:0.03em;text-transform:uppercase;}
  .nav-name span{color:var(--red);}
  .nav-links{display:flex;gap:26px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;}
  .nav-links a{color:var(--gray);transition:color .2s;}
  .nav-links a:hover{color:var(--white);}
  @media (max-width:640px){ .nav-links{gap:16px;font-size:11px;} }

  .hero{
    position:relative;
    text-align:center;
    padding:96px 24px 72px;
    border-bottom:1px solid var(--line);
  }
  .hero-eyebrow{
    color:var(--red);font-weight:700;font-size:14px;letter-spacing:0.08em;
    margin-bottom:16px;text-transform:uppercase;
  }
  .hero h1{
    font-size:clamp(44px,8vw,84px);
    color:var(--white);
  }
  .hero-sub{
    margin:18px auto 0;font-size:17px;color:var(--gray);max-width:44ch;line-height:1.55;
  }
  .hero-cta{margin-top:32px;display:flex;gap:14px;flex-wrap:wrap;justify-content:center;}
  .btn{
    display:inline-block;padding:13px 22px;font-weight:700;font-size:13px;
    letter-spacing:0.05em;text-transform:uppercase;
    border:1px solid var(--white);transition:all .2s;
  }
  .btn.primary{background:var(--red);border-color:var(--red);color:var(--white);}
  .btn.primary:hover{background:var(--red-dark);border-color:var(--red-dark);}
  .btn.ghost:hover{background:var(--white);color:var(--black);}

  section{padding:72px 0;position:relative;}
  .section-head{margin-bottom:36px;max-width:60ch;margin-left:auto;margin-right:auto;text-align:center;}
  .section-head .display{font-size:clamp(28px,4vw,40px);color:var(--white);}
  .section-head p{color:var(--gray);margin-top:12px;font-size:15px;line-height:1.6;}

  .vitals{border:1px solid var(--line);background:var(--panel);max-width:520px;margin:0 auto;}
  .vitals-row{
    display:flex;justify-content:space-between;padding:14px 20px;
    border-bottom:1px solid var(--line);font-size:14px;
  }
  .vitals-row:last-child{border-bottom:none;}
  .vitals-row span:first-child{color:var(--gray);}
  .vitals-row span:last-child{font-weight:700;color:var(--white);}
  .vitals-title{
    padding:16px 20px;font-family:'Anton',sans-serif;letter-spacing:0.04em;
    background:var(--red);color:var(--white);font-size:15px;text-align:center;
  }

  .contact-card{border:1px solid var(--line);background:var(--panel);padding:26px 28px;max-width:520px;margin:0 auto;}
  .contact-card h4{font-family:'Anton',sans-serif;font-size:16px;letter-spacing:0.04em;margin-bottom:16px;}
  .contact-row{font-size:14px;color:#d5d5d5;margin-bottom:8px;}
  .contact-row span{color:var(--gray);}

  footer{padding:56px 0 40px;border-top:1px solid var(--line);}
  .links-grid{
    display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:40px;max-width:760px;margin-left:auto;margin-right:auto;
  }
  .link-pill{
    border:1px solid var(--line);padding:16px 18px;font-size:13px;font-weight:600;
    display:flex;align-items:center;justify-content:space-between;transition:all .2s;
  }
  .link-pill:hover{border-color:var(--red);color:var(--red);}
  .foot-bottom{
    display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:10px;
    color:var(--gray);font-size:13px;text-align:center;
  }
  .foot-bottom .brand{color:var(--white);font-weight:700;}
  @media (max-width:640px){ .links-grid{grid-template-columns:1fr;} }
`;
