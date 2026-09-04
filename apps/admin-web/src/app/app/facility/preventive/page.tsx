import { redirect } from 'next/navigation';

export default function PreventiveMaintenanceRedirectPage() {
  redirect('/app/facility/maintenance-plans');
}
