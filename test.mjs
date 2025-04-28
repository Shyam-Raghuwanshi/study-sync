import { Resend } from 'resend';

const resend = new Resend("re_6MuAneTb_Bn8SwZnSyjre4mYqBWatroPN")
const { data, error } = await resend.emails.send({
    from: 'onboarding@resend.dev',
    to: "shyamraghuonec@gmail.com",
    subject: "Welcome to Resend",
    html: "<div>hi</div>",
});

console.log("Email sent successfully:", data, error);