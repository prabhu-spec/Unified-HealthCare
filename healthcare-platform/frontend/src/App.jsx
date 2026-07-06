import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthProvider from '@/components/AuthProvider';
import ProtectedRoute from '@/pages/ProtectedRoute';
import DashboardLayout from '@/pages/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import ForgotEmailPage from '@/pages/ForgotEmailPage';
import DashboardContainer from '@/pages/DashboardContainer';
import HospitalsPage from '@/pages/HospitalsPage';
import PatientsPage from '@/pages/PatientsPage';
import PatientDetailPage from '@/pages/PatientDetailPage';
import AppointmentsPage from '@/pages/AppointmentsPage';
import PatientQueuePage from '@/pages/PatientQueuePage';
import HistoryPage from '@/pages/HistoryPage';
import RecordsPage from '@/pages/RecordsPage';
import PrescribePage from '@/pages/PrescribePage';
import HospitalApplicationPage from '@/pages/HospitalApplicationPage';
import MedicinesPage from '@/pages/MedicinesPage';
import MedicineOrdersPage from '@/pages/MedicineOrdersPage';
import PrescriptionOrdersPage from '@/pages/PrescriptionOrdersPage';
import PharmacyStockPage from '@/pages/PharmacyStockPage';
import PrescriptionUploadPage from '@/pages/PrescriptionUploadPage';
import InsuranceRenewalPage from '@/pages/InsuranceRenewalPage';
import BedAvailabilityPage from '@/pages/BedAvailabilityPage';
import InventoryPage from '@/pages/InventoryPage';
import RestockPage from '@/pages/RestockPage';
import PrescriptionVerifyPage from '@/pages/PrescriptionVerifyPage';
import PoliciesPage from '@/pages/PoliciesPage';
import ApplicantsPage from '@/pages/ApplicantsPage';
import PolicyStatusPage from '@/pages/PolicyStatusPage';
import HospitalDoctorsPage from '@/pages/HospitalDoctorsPage';
import HospitalPatientsPage from '@/pages/HospitalPatientsPage';
import HospitalPharmacyPage from '@/pages/HospitalPharmacyPage';
import HospitalBedsPage from '@/pages/HospitalBedsPage';
import HospitalStaffPage from '@/pages/HospitalStaffPage';
import SchedulerPage from '@/pages/SchedulerPage';
import PlatformTestingPage from '@/pages/PlatformTestingPage';
import HospitalBillingPage from '@/pages/HospitalBillingPage';
import ReceiptsPage from '@/pages/ReceiptsPage';
import SystemLogsPage from '@/pages/SystemLogsPage';
import ProfilePage from '@/pages/ProfilePage';
import HospitalDetailPage from '@/pages/HospitalDetailPage';
import MedicalDocumentsPage from '@/pages/MedicalDocumentsPage';
import RequestBloodPage from '@/pages/RequestBloodPage';
import BloodRequestsPage from '@/pages/BloodRequestsPage';
import BloodInventoryPage from '@/pages/BloodInventoryPage';
import DonationRequestsPage from '@/pages/DonationRequestsPage';
import VideoMeetPage from '@/pages/VideoMeetPage';
import TelemetryOverviewPage from '@/pages/telemetry/TelemetryOverviewPage';
import TelemetryLivePage from '@/pages/telemetry/TelemetryLivePage';
import TelemetryDevicesPage from '@/pages/telemetry/TelemetryDevicesPage';
import TelemetryAssignmentsPage from '@/pages/telemetry/TelemetryAssignmentsPage';
import AiAssistPage from '@/pages/AiAssistPage';
import AiAuditLogsPage from '@/pages/AiAuditLogsPage';

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/forgot-email" element={<ForgotEmailPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardContainer />} />
            <Route path="hospitals" element={<HospitalsPage />} />
            <Route path="hospital/:id" element={<HospitalDetailPage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="patients/:id" element={<PatientDetailPage />} />
            <Route path="ai-assist" element={<AiAssistPage />} />
            <Route path="ai-audit" element={<AiAuditLogsPage />} />
            <Route path="appointments" element={<AppointmentsPage />} />
            <Route path="scheduler" element={<SchedulerPage />} />
            <Route path="platform-testing" element={<PlatformTestingPage />} />
            <Route path="video-meet" element={<VideoMeetPage />} />
            <Route path="telemetry/overview" element={<TelemetryOverviewPage />} />
            <Route path="telemetry/live" element={<TelemetryLivePage />} />
            <Route path="telemetry/devices" element={<TelemetryDevicesPage />} />
            <Route path="telemetry/assignments" element={<TelemetryAssignmentsPage />} />
            <Route path="queue" element={<PatientQueuePage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="records" element={<RecordsPage />} />
            <Route path="prescribe" element={<PrescribePage />} />
            <Route path="hospital-application" element={<HospitalApplicationPage />} />
            <Route path="medicines" element={<MedicinesPage />} />
            <Route path="medicine-orders" element={<MedicineOrdersPage />} />
            <Route path="prescription-orders" element={<PrescriptionOrdersPage />} />
            <Route path="documents" element={<MedicalDocumentsPage />} />
            <Route path="request-blood" element={<RequestBloodPage />} />
            <Route path="blood-requests" element={<BloodRequestsPage />} />
            <Route path="blood-inventory" element={<BloodInventoryPage />} />
            <Route path="donation-requests" element={<DonationRequestsPage />} />
            <Route path="pharmacy-stock" element={<PharmacyStockPage />} />
            <Route path="prescription-upload" element={<PrescriptionUploadPage />} />
            <Route path="insurance-renewal" element={<InsuranceRenewalPage />} />
            <Route path="bed-availability" element={<BedAvailabilityPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="restock" element={<RestockPage />} />
            <Route path="prescription-verify" element={<PrescriptionVerifyPage />} />
            <Route path="policies" element={<PoliciesPage />} />
            <Route path="applicants" element={<ApplicantsPage />} />
            <Route path="policy-status" element={<PolicyStatusPage />} />
            <Route path="hospital/doctors" element={<HospitalDoctorsPage />} />
            <Route path="hospital/patients" element={<HospitalPatientsPage />} />
            <Route path="hospital/pharmacy" element={<HospitalPharmacyPage />} />
            <Route path="hospital/beds" element={<HospitalBedsPage />} />
            <Route path="hospital/staff" element={<HospitalStaffPage />} />
            <Route path="hospital/billing" element={<HospitalBillingPage />} />
            <Route path="receipts" element={<ReceiptsPage />} />
            <Route path="logs" element={<SystemLogsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
