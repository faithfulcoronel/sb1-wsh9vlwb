import React from 'react';
import { Card } from '../../components/ui/Card';
import { Shield } from 'lucide-react';

function Privacy() {
  return (
    <div className="space-y-8">
      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-primary-600" />
          Information We Collect
        </h4>
        <div className="bg-gray-50 rounded-lg p-4 text-gray-600 leading-relaxed">
          <p>
            We collect information that you provide directly to us, including personal information such as:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Names and contact information</li>
            <li>Email addresses and phone numbers</li>
            <li>Membership and attendance records</li>
            <li>Financial contribution data</li>
            <li>Ministry participation information</li>
          </ul>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">How We Use Your Information</h4>
        <div className="bg-gray-50 rounded-lg p-4 text-gray-600 leading-relaxed">
          <p>We use the information we collect to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Provide and maintain our church administration services</li>
            <li>Communicate with you about church activities and events</li>
            <li>Process donations and maintain accurate financial records</li>
            <li>Manage membership and attendance records</li>
            <li>Facilitate ministry and volunteer coordination</li>
          </ul>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Information Sharing and Security</h4>
        <div className="bg-gray-50 rounded-lg p-4 text-gray-600 leading-relaxed">
          <p className="mb-4">
            We do not sell or share your personal information with third parties except as necessary to provide our services or as required by law.
          </p>
          <p>
            We implement appropriate technical and organizational security measures to protect your personal information, including:
          </p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Encryption of sensitive data</li>
            <li>Secure access controls</li>
            <li>Regular security assessments</li>
            <li>Staff training on data protection</li>
          </ul>
        </div>
      </section>

      <section>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Rights and Choices</h4>
        <div className="bg-gray-50 rounded-lg p-4 text-gray-600 leading-relaxed">
          <p>You have the right to:</p>
          <ul className="list-disc ml-6 mt-2 space-y-1">
            <li>Access your personal information</li>
            <li>Correct inaccurate or incomplete information</li>
            <li>Request deletion of your information</li>
            <li>Opt-out of certain communications</li>
            <li>File a complaint with relevant authorities</li>
          </ul>
          <p className="mt-4">
            Contact your church administrator to exercise these rights or for any privacy-related concerns.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Privacy;