import { redirect } from 'next/navigation'

const OPEN_HOUSE_EMAIL_DESTINATION =
  '/?view=ohfeedback&utm_source=email&utm_medium=plain&utm_campaign=realtors-oh-plain'

export default function OpenHouseEmailLink() {
  redirect(OPEN_HOUSE_EMAIL_DESTINATION)
}
