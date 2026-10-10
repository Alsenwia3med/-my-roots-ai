/**
 * Superseded by PUB-10, which C-05 places at /contact?status=sent.
 *
 * This route previously rendered its own confirmation and generated a reference in the browser
 * ("for demo purposes"), so the number shown to the sender matched nothing the team could look
 * up. References are now issued by the server and travel in the enquiry email. Anyone reaching
 * the old address is sent to the confirmation screen rather than shown a second one.
 */

import { redirect } from 'next/navigation';

export default function ContactSuccessRedirect() {
  redirect('/contact?status=sent');
}
