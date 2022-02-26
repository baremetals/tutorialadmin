const from = process.env.EMAIL_FROM;
async function sendMail({
  to,
  username,
  subject,
  title,
  message,
  btnText,
  btnLink,
}) {
  await strapi.plugins["email"].services.email.send({
    to,
    from,
    subject,
    html: `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">

    <!-- CSS Reset : BEGIN -->
    <style>
       
        html,
        body {
            margin: 0 auto !important;
            padding: 0 !important;
            height: 100% !important;
            width: 100% !important;
            background: #f1f1f1;
        }

        * {
            -ms-text-size-adjust: 100%;
            -webkit-text-size-adjust: 100%;
        }

        div[style*="margin: 16px 0"] {
            margin: 0 !important;
        }


        table,
        td {
            mso-table-lspace: 0pt !important;
            mso-table-rspace: 0pt !important;
        }


        table {
            border-spacing: 0 !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            margin: 0 auto !important;
        }


        img {
            -ms-interpolation-mode: bicubic;
        }


        a {
            text-decoration: none;
        }

        *[x-apple-data-detectors], /* iOS */
        .unstyle-auto-detected-links *,
        .aBn {
            border-bottom: 0 !important;
            cursor: default !important;
            color: inherit !important;
            text-decoration: none !important;
            font-size: inherit !important;
            font-family: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
        }

        .a6S {
            display: none !important;
            opacity: 0.01 !important;
        }

        .im {
            color: inherit !important;
        }

        img.g-img + div {
            display: none !important;
        }

        /* iPhone 4, 4S, 5, 5S, 5C, and 5SE */
        @media only screen and (min-device-width: 320px) and (max-device-width: 374px) {
            u ~ div .email-container {
                min-width: 320px !important;
            }
        }
        /* iPhone 6, 6S, 7, 8, and X */
        @media only screen and (min-device-width: 375px) and (max-device-width: 413px) {
            u ~ div .email-container {
                min-width: 375px !important;
            }
        }
        /* iPhone 6+, 7+, and 8+ */
        @media only screen and (min-device-width: 414px) {
            u ~ div .email-container {
                min-width: 414px !important;
            }
        }
    </style>

    <!-- CSS Reset : END -->

    <!-- Progressive Enhancements : BEGIN -->
    <style>
        .primary {
            background: #ffc0d0;
        }

        .bg_white {
            background: #ffffff;
        }

        .bg_light {
            background: #fafafa;
        }

        .bg_black {
            background: #000000;
        }

        .bg_dark {
            background: rgba(0,0,0,.8);
        }

        .email-section {
            padding: 2.5em;
        }

        /*BUTTON*/
        .btn {
            padding: 5px 20px;
            display: inline-block;
        }

            .btn.btn-primary {
                border-radius: 5px;
                background: #ffc0d0;
                color: #ffffff;
            }

            .btn.btn-white {
                border-radius: 5px;
                background: #ffffff;
                color: #000000;
            }

            .btn.btn-white-outline {
                border-radius: 5px;
                background: transparent;
                border: 1px solid #fff;
                color: #fff;
            }

            .btn.btn-black {
                border-radius: 0px;
                background: #000;
                color: #fff;
            }

            .btn.btn-black-outline {
                border-radius: 0px;
                background: transparent;
                border: 2px solid #000;
                color: #000;
                font-weight: 700;
            }

        h1, h2, h3, h4, h5, h6 {
            font-family:Arial; letter-spacing:2px;
            color: #000000;
            margin-top: 0;
            font-weight: 400;
        }

        body {
            font-family: Arial;
            font-weight: 400;
            font-size: 15px;
            line-height: 24px;
            color: rgba(0,0,0,.5);
        }

        a {
            color: #ffc0d0;
        }

        table {
        }
        /*LOGO*/

        .logo h1 {
            margin: 0;
        }

            .logo h1 a {
                color: #000000;
                font-size: 30px;
                font-weight: 700;
                /*text-transform: uppercase;*/
                font-family: 'Playfair Display', sans-serif;
                font-style: italic;
            }

        .navigation {
            padding: 0;
            padding: 1em 0;
            /*background: rgba(0,0,0,1);*/
            border-top: 1px solid rgba(0,0,0,.05);
            border-bottom: 1px solid rgba(0,0,0,.05);
            margin: 0;
        }

            .navigation li {
                list-style: none;
                display: inline-block;
                margin-left: 2px;
                margin-right: 2px;
                font-size: 11px;
                font-weight: 500;
                text-transform: none;
                letter-spacing: 2px;
            }

                .navigation li a {
                    color: #fff;
                    font-size: 11px;
                }

        /*HERO*/
        .hero {
            position: relative;
            z-index: 0;
        }

            .hero .overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                content: '';
                width: 100%;
                background: #000000;
                z-index: -1;
                opacity: .2;
            }

        

                .hero .text h2 {
                    color: #fff;
                    font-size: 30px;
                    margin-bottom: 0;
                    font-weight: 300;
                    line-height: 1.4;
                }

                 



        

        ul.social {
            padding: 0;
        }

            ul.social li {
                display: inline-block;
                margin-right: 10px;
            }

        /*FOOTER*/

        .footer {
            border-top: 1px solid rgba(0,0,0,.05);
            color: rgba(0,0,0,.5);
        }

            .footer .heading {
                color: #000;
                font-size: 20px;
            }

            .footer ul {
                margin: 0;
                padding: 0;
            }

                .footer ul li {
                    list-style: none;
                    margin-bottom: 10px;
                }

                    .footer ul li a {
                        color:#fff;
                    }

    </style>


</head>

<body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color:#f1f1f1;">
    <center style="width: 100%; background-color: #f1f1f1;">
    <div style="display: none; font-size: 1px;max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">

    </div>
    <div style="max-width: 600px; margin: 0 auto;" class="email-container">
    	<!-- BEGIN BODY -->
      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">
      	<tr>
          <td valign="top" class="bg_white" style="padding:10px 2.5em 10px 2.5em;">
          	<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
          		<tr>
          			<td class="logo" style="text-align: center; padding:20px 0">
			            <h1><a href="https://baremetals.io"><img src="https://storage.googleapis.com/baremets_tutor/resized_image_Promo_180fd5bf29/resized_image_Promo_180fd5bf29.jpeg?updated_at=2022-02-24T15:12:00.868Z" alt="site logo" /></a></h1>
			          </td>
          		</tr>
          	</table>
          </td>
	      </tr><!-- end tr -->
	      <tr>
          <td valign="middle" class="hero bg_white" style="background:#5634bf; background-size: cover; height:100px;">
          	<div class="overlay"></div>
            <table>
            	<tr>
            		<td>
            			<div class="text" style="padding:20px 0 0 0em; text-align: center;">
            				<h2 style="padding-bottom:20px; font-size:20px;">${title}</h2>
            			</div>
            		</td>
            	</tr>
            </table>
          </td>
	      </tr><!-- end tr -->
				<tr>
          <td valign="middle" class="intro bg_white" style="padding:1em 0 1em 0;">
            <table>
            	<tr>
            		<td>
            			<div class="text" style="padding: 0 2.5em; text-align: left; color:#000;">
                            <p>Hello, ${username}</p>
            				<p>${message}</p>
                            <p style="padding-top:12px;"><a href="https://baremetals.io/${btnLink}" style="background:#5634bf; color:#fff; padding:12px 30px; border-radius:20px; font-weight:600;">${btnText}</a></p>
            			</div>
            		</td>
            	</tr>
            </table>
          </td>
	      </tr><!-- end tr -->
      <!-- 1 Column Text + Button : END -->
      </table>
      <table align="center" role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: auto;">
      	<tr>
          <td valign="middle" style="padding:10px 2em; background:#fff; border-top:solid 1px #f1f1f1; text-align: left; color:#000;">
              <p>Baremetals Limited</p>
          </td>
        </tr><!-- end: tr -->
          <tr>
          <td valign="middle" class="bg_white footer" style="padding:10px 0 0 0em; text-align: left; color:#000; background:#000;">
            <table>
            	<tr style="text-align: left;">
                <td valign="middle" width="80%" style="padding-top:0px; text-align: left; color:#fff;">
                	<ul class="navigation">
			            <li><a href="https://baremetals.io/terms">Terms</a></li>
			            <li><a href="https://baremetals.io/privacy">Client privacy policy</a></li>
			            <li><a href="https://baremetals.io/support">Support</a></li>
			        </ul>
                </td>
                <td valign="middle" width="20%" style="padding-top:0px; text-align: right;">
                	<ul style="" class="social">
                        <li style="margin-bottom:0; vertical-align: middle; padding:0 4px"><a href="https://www.linkedin.com/in/daniel-asante-205504127/"><img src="https://storage.googleapis.com/baremets_tutor/linkedin_icon_06d65d8cd9/linkedin_icon_06d65d8cd9.png?updated_at=2022-02-24T12:58:26.690Z" alt="linkedin icon" style="width:18px;"  /></a></li>
                         <li style="margin-bottom:0; vertical-align: middle; padding:0 4px"><a href="https://twitter.com/bare_academy"><img src="https://storage.googleapis.com/baremets_tutor/twitter_icon_59c92aac4b/twitter_icon_59c92aac4b.png?updated_at=2022-02-24T12:58:40.344Z" alt="twitter icon" style="width:18px;" /></a></li>
                    </ul>
                </td>
              </tr>
            </table>
          </td>
        </tr><!-- end: tr -->
      </table>

    </div>
  </center>
</body>
</html>
`,
  });
}

module.exports = {
  sendMail,
};
