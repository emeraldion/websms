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
 *	vodafone-it.conf.js
 *
 *	Parametri di configurazione per l'invio sms tramite Vodafone (vodafone.it)	
 *
 *	Changelog
 *	---------
 *  2008-03-11  Corretto contatore sms mancanti
 *  2008-08-19  Corretti url
 *	2008-02-15	Corretto success_marker.
 *	2007-11-05	Aggiornato per cambiamenti al sito 190.it
 *	2007-01-29	Aggiunta variabile VODAFONE_SENDER_NUMBER per account di tipo B 
 *	2007-01-22	Aggiunta verifica di account inattivo al passo 1
 *	2007-01-19	Aggiunto supporto per il Captcha
 *	2006-10-20	Aggiornato per cambiamenti al sito 190.it
 *	2006-07-23	Aggiunta la firma in coda al messaggio
 *	2006-03-22	Aggiornati gli indirizzi per riflettere i cambiamenti del sito 190.it
 *
 */

Plugins["vodafone-it"] = {
	name: "Vodafone Italia",
	version: "1.3.3",
	max_message_length: 360,
	success_marker: /stata elaborata correttamente/,
	charset: "iso-8859-1",
	steps: [
		{
			referrer: "http://www.vodafone.it/190/trilogy/jsp/home.do?tabName=HOME+190&BV_UseBVCookie=No&ty_skip_md=true",
			action: "https://www.vodafone.it/190/trilogy/jsp/login.do",
			data: "username=%USERNAME%&password=%PASSWORD%&login_button=",
			flags: "-L -s",
			check:
			{
				match: /reminder\/choose_reminder\.jsp/,
				reason: "Account inattivo"
			}
		},
		{
			referrer: "http://www.vodafone.it/190/trilogy/jsp/home.do?BV_UseBVCookie=No&tabName=HOME+190",
			action: "http://www.vodafone.it/190/trilogy/jsp/dispatcher.do?ty_key=fdt_invia_sms&tk=9616,c",
			data: "",
			flags: "-L -s"
		},
		{
			referrer: "http://www.vodafone.it/190/trilogy/jsp/common/ty_iPage.jsp?retURL=http%3A%2F%2Fwww.areaprivati.190.it%2F190%2Ftrilogy%2Fjsp%2Fdispatcher.do%3Fty_key%3Dfsms_hp",
			action: "http://www.areaprivati.vodafone.it/190/trilogy/jsp/dispatcher.do?ty_key=fsms_hp&ipage=next",
			data: "",
			flags: "-L -s",
			vars: [
				{
					match: /<select name="senderNumber" style="width:130px" class="text"><option value="(\d+)">/,
					name: "VODAFONE_SENDER_NUMBER"
				}]
		},
		{
			referrer: "http://www.areaprivati.vodafone.it/190/trilogy/jsp/dispatcher.do?ty_key=fsms_hp&ipage=next",
			action: "http://www.areaprivati.vodafone.it/190/fsms/prepare.do",
			data: "pageTypeId=9604&programId=10384&channelId=-18126&senderNumber=%VODAFONE_SENDER_NUMBER%&receiverNumber=%TO%&message=%TEXT%%20%FROM%",
			flags: "-L -s",
			vars: [
				{
					match: /(\/190\/fsms\/generateimg\.do)/,
					name: "VODAFONE_CAPTCHA_URL",
					escape: false
				}],
			check: [
				{
					match: /Ti ricordiamo che puoi inviare SMS via Web solo a numeri di cellulare Vodafone/gi,
					reason: "Puoi inviare SMS soltanto a numeri Vodafone"
				}],
			captcha: "http://www.areaprivati.vodafone.it%VODAFONE_CAPTCHA_URL%"
		},
		{
			referrer: "http://www.areaprivati.vodafone.it/190/fsms/prepare.do",
			action: "http://www.areaprivati.vodafone.it/190/fsms/send.do",
			data: "verifyCode=%CAPTCHA%&pageTypeId=9604&programId=10384&channelId=-18126&senderNumber=%VODAFONE_SENDER_NUMBER%&receiverNumber=%TO%&message=%TEXT%%20%FROM%",
			flags: "-L -s",
			check: [
				{
					match: /Verifica la correttezza dei dati da te inseriti e invia il tuo SMS via web/,
					reason: "Hai inserito un codice scorretto"
				}],
                
                // thanks to Michele Mazzucchi - adapted by Nicola Del Monaco
                availabilityCheck: function(__text) {
				// messages allowed every day
				var messagesADay = 10;
				// messages left for this day
				var messagesLeft;
				
				// compute "today"
				var d = new Date();
				var curdate_ddmmyyyy = d.getDate().toString() + "-" + d.getMonth().toString() + "-" + d.getFullYear().toString();
				
				// records of previous messages sent?
				var record_date = widget.preferenceForKey("vodanew_smsleft_date");
				
				if (record_date == undefined || record_date != curdate_ddmmyyyy) {
					// no records for today
					// have all the messages available for this day minus the one just sent
					messagesLeft = messagesADay - 1;
					
					// store/update the number of messages left for today
					widget.setPreferenceForKey(curdate_ddmmyyyy, "vodanew_smsleft_date");
				} else {
					// some of today's messages are already consumed. Recall how many
					messagesLeft = widget.preferenceForKey("vodanew_smsleft_number");
					if (messagesLeft == undefined) {
						// unexpectedly found date but not number. Set it to messagesADay-1
						messagesLeft = messagesADay - 1;
					} else {
						// information retrieved, update the counter
						messagesLeft = messagesLeft - 1;
					}
                }
                // end check
		        // store/update the number of messages left for today
				widget.setPreferenceForKey(messagesLeft, "vodanew_smsleft_number");
				
				// return the number of messages left
				return messagesLeft;
            }
        }
	]
};
