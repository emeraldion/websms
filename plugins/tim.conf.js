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
 *	tim.conf.js
 *
 *	Parametri di configurazione per l'invio sms tramite TIM	
 *
 *	Changelog
 *	---------
 *	2008-05-20	Updated after changes to TIM customer area.
 *	2008-02-08	Empty plugin step properties no longer required.
 *	2007-08-21	Aggiunto controllo per messaggio di errore numero destinatario non TIM
 *				(una novità che non merita alcun commento).
 *	2007-04-21	Modificato per cambiamenti all'area 119 (Lavoro anche il giorno del mio compleanno, ARGH!)
 *	2007-03-10	Modificato per cambiamenti al sito TIM
 *	2007-01-18	Aggiunto controllo al passo finale per l'errore "Servizio non disponibile"
 *				Aggiunta firma in coda al messaggio.
 *	2007-01-17	Riscritto per la nuova interfaccia web che fa uso di Captcha (non ancora funzionante).
 *	2010-01-16	Modificato per cambiamento flusso ares SMS web.
 *
 */

Plugins["tim"] = {
	name: "TIM",
	version: "1.4.1",
	max_message_length: 640,
	success_marker: /SMS inviato/,
	charset: "iso-8859-1",
	steps: [
		{
			// 1: homepage
			action: "http://www.tim.it/consumer/homepage.do",
			flags: "-L -s"
		},
		{
			// 2: login
			referrer: "http://www.tim.it/consumer/homepage.do",
			action: "https://www.tim.it/authfe/login.do",
			data: "login=%USERNAME%&password=%PASSWORD%&portale=timPortale&urlOk=https%3A%2F%2Fwww.119selfservice.tim.it%2F119%2Fconsumerdispatcher",
			flags: "-L -s"
		},
		{
			// 3: load service status frame
			referrer: "https://www.119selfservice.tim.it/cdas119/p2078/serv.do",
			action: "https://www.119selfservice.tim.it/119/cruscotto/area119/actiondispatcher.do?type=1",
			flags: "-L -s"
		},
		{
			// 4: click on SMS link on right sidebar
			referrer: "https://www.119selfservice.tim.it/cdas119/p2078/serv.do",
			action: "https://smsweb.tim.it/sms-web/adddispatch?start=new",
			flags: "-L -s",
			availabilityCheck: function(__text)
			{
				return __text.match(/sms.jpg" style="float: left;"\/><div class="color_blue" style="float: left;">\s+(\d+)\s+<\/div>/)[1] - 1;
			},
			vars: [
				{
					match: /input name="t:formdata" type="hidden" value="([^"]+)"/,
					name: "TIM_TFORMDATA1"
				},
				{
					match: /id="seperateFreeNumbers:hidden" name="t:formdata" type="hidden" value="([^"]+)"/,
					name: "TIM_TFORMDATA2"
				},
				{
					match: /id="seperateContactList:hidden" name="t:formdata" type="hidden" value="([^"]+)"/,
					name: "TIM_TFORMDATA3"
				},
				{
					match: /id="seperateContacts:hidden" name="t:formdata" type="hidden" value="([^"]+)"/,
					name: "TIM_TFORMDATA4"
				}],
			check: [
				{
					match: /Oggi hai raggiunto il numero massimo di SMS gratis a tua disposizione./i,
					reason: "SMS odierni esauriti"
				}]
		},
		{
			// 5: submit composer
			referrer: "https://smsweb.tim.it/sms-web/adddispatch?start=new",
			action: "https://smsweb.tim.it/sms-web/adddispatch.adddispatchform",
			data: "t%3Aformdata=%TIM_TFORMDATA1%&t%3Aformdata=%TIM_TFORMDATA2%&t%3Aformdata=%TIM_TFORMDATA3%&t%3Aformdata=%TIM_TFORMDATA4%&contactListId=&contactsIdString=&modelsSelect=&recipientType=FREE_NUMBERS&freeNumbers=%TO%&deliverySmsClass=STANDARD&textAreaFlash=&textAreaStandard=%TEXT%%20%FROM%",
			flags: "-s"
		},
		{
			referrer: "https://smsweb.tim.it/sms-web/adddispatch.adddispatchform",
			action: "https://smsweb.tim.it/sms-web/validatecaptcha/Dispatch",
			vars: [
				{
					match: /input name="t:formdata" type="hidden" value="([^"]+)"/,
					name: "TIM_TFORMDATA"
				}],
			// captcha
			captcha: "https://smsweb.tim.it/sms-web/validatecaptcha:image/false?t%3Aac=Dispatch"
		},
		{
			// 6: send
			referrer: "https://smsweb.tim.it/sms-web/validatecaptcha/Dispatch",
			action: "https://smsweb.tim.it/sms-web/validatecaptcha.validatecaptchaform",
			data: "t%3Aac=Dispatch&verificationCode=%CAPTCHA%&t%3Aformdata=%TIM_TFORMDATA%",
			flags: "-L -s",
			check: [
				{
					match: /Le lettere che hai inserito non corrispondono a quelle presenti nell'immagine/,
					reason: "Hai inserito un codice scorretto"
				},
				{
					match: /SMS non inviato, il numero non/i,
					reason: "Puoi inviare SMS soltanto a destinatari TIM"
				},
				{
					match: /SMS non inviato, sistema non disponibile/i,
					reason: "Servizio non disponibile"
				},
				{
					match: /Il servizio e' momentaneamente non disponibile\./,
					reason: "Servizio non disponibile"
				}]
		}
	]
};
