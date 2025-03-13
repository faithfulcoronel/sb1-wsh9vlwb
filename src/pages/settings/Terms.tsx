import React from 'react';
import { FileText } from 'lucide-react';

function Terms() {
  return (
    <div className="space-y-8">
      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-primary-600" />
          Acceptance of Terms
        </h4>
        <div className="bg-gray-50 rounded-lg p-4 text-gray-600 leading-relaxed">
          <p>
            By accessing and using this church administration system, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using the service.
          </p>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">User Responsibilities</h4>
        <div className="bg-gray-50 rounded-lg p-4 text-gray-600 leading-relaxed">
          <p className="mb-4">Users must:</p>
          <ul className="list-disc ml-6 space-y-2">
            <li>Maintain the confidentiality of their account credentials</li>
            <li>Use the system only for authorized church administration purposes</li>
            <li>Respect the privacy and rights of other users</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Report any security concerns or unauthorized access</li>
          </ul>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">System Usage and Data Privacy</h4>
        <div className="bg-gray-50 rounded-lg p-4 text-gray-600 leading-relaxed">
          <div className="mb-4">
            <h5 className="font-medium mb-2">Acceptable Use</h5>
            <p>
              The church administration system is provided "as is" and is to be used solely for legitimate church administration purposes. Any unauthorized use or abuse of the system may result in immediate termination of access.
            </p>
          </div>
          <div>
            <h5 className="font-medium mb-2">Data Handling</h5>
            <p>
              Users agree to handle all personal and sensitive information in accordance with applicable privacy laws and church policies. This includes maintaining confidentiality and using data only for authorized purposes.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Termination and Changes</h4>
        <div className="bg-gray-50 rounded-lg p-4 text-gray-600 leading-relaxed">
          <div className="mb-4">
            <h5 className="font-medium mb-2">Account Termination</h5>
            <p>
              Access to the system may be terminated for violations of these terms or at the discretion of church administration. Users will be notified of any such action.
            </p>
          </div>
          <div>
            <h5 className="font-medium mb-2">Updates to Terms</h5>
            <p>
              We reserve the right to modify these terms at any time. Users will be notified of significant changes, and continued use of the system constitutes acceptance of updated terms.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h4>
        <div className="bg-gray-50 rounded-lg p-4 text-gray-600 leading-relaxed">
          <p>
            For questions about these Terms of Service or to report violations, please contact your church administrator or system support team.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Terms;