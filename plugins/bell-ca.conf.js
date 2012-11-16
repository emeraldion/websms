/**
 *	WebSMS widget
 *
 *	© Claudio Procida 2006-2010
 *
 *	Disclaimer
 *
 *	The WebSMS Widget software (from now, the "Software") and the accompanying materials
 *	are provided “AS IS” without warranty of any kind. IN NO EVENT SHALL THE AUTHOR(S) BE
 *	LIABLE TO ANY PARTY FOR DIRECT, INDIRECT, SPECIAL, INCIDENTAL, OR CONSEQUENTIAL DAMAGES,
 *	INCLUDING LOST PROFITS, ARISING OUT OF THE USE OF THIS SOFTWARE AND ITS DOCUMENTATION, EVEN
 *	IF THE AUTHOR(S) HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. The entire risk as to
 *	the results and performance of this software is assumed by you. If the software is
 *	defective, you, and not its author(s), assume the entire cost of all necessary servicing,
 *	repairs and corrections. If you do not agree to these terms and conditions, you may not
 *	install or use this software.
 */

/**
 * bell-ca.conf.js
 *
 * © Claudio Procida 2008
 *
 * WebSMS plugin for Bell Canada (http://www.bell.ca)
 *
 * Changelog
 * ---------
 *  2008-08-31  Created. Happy birthday to my brother Marco!
 *
 */

Plugins["bell-ca"] = {
	name: "Bell Canada",
	max_message_length: 140,
	success_marker: /./,
	steps: [
		// 1. step required in order to have a stored cookie to feed for captcha request in step 2
		{
			action: "http://www.txt.bell.ca/bell/en/",
			flags: "-L -s"			
		},
		// 2. load page, extract service number, show captcha
		{
			action: "http://www.txt.bell.ca/bell/en/",
			captcha: "http://www.txt.bell.ca/bell/en/service?s=%BELL_CA_SERVICE_S%",
			vars: [
				{
					name: "BELL_CA_SERVICE_S",
					match: /<input type="hidden" name="service_s" value="([^"]+)" \/>/
				}
			],
			flags: "-L -s"
		},
		// 3. send message
		{
			referrer: "http://www.txt.bell.ca/bell/en/",
			action: "http://www.txt.bell.ca/bell/en/BmgServlet",
			data: "destination_address=%TO%&sent_by=%FROM%&reply_to_choice=sms&reply_to=&short_message=%TEXT%&char_count=&priority=0&text_captcha=%CAPTCHA%&service_s=%BELL_CA_SERVICE_S%&submit=send",
			vars: [
				{
					name: "BELL_CA_CONFIRMATION_NUMBER",
					match: /<div class="formvaluetext">(\d+)<\/div>/
				}
			],
			flags: "-L -s"
		},
		// 4. go to message status page
		{
			referrer: "http://www.txt.bell.ca/bell/en/",
			action: "http://www.txt.bell.ca/bell/en/messageStatus.jsp?c=%BELL_CA_SERVICE_S%",
			vars: [
				{
					name: "BELL_CA_T03",
					match: /<input name="t_03" type="hidden" value="([^"]+)" \/>/ 
				}
			],
			flags: "-L -s"
		},
		// 5. check message status
		{
			referrer: "http://www.txt.bell.ca/bell/en/messageStatus.jsp?c=%BELL_CA_SERVICE_S%",
			action: "http://www.txt.bell.ca/bell/en/StatusServlet",
			data: "t_03=%BELL_CA_T03%&message_id=%BELL_CA_CONFIRMATION_NUMBER%&destination_address=%TO%",
			flags: "-L -s",
			check: [
				{
					match: />Failed</,
					reason: "Sending failed"
				}
			]
		}
	]
};