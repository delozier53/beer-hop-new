import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Terms of Service</CardTitle>
            <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h3>
                <p className="text-gray-700 leading-relaxed">
                  By accessing and using Beer Hop ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">2. Description of Service</h3>
                <p className="text-gray-700 leading-relaxed">
                  Beer Hop is a mobile-first web application that allows users to discover breweries, check into locations, 
                  track visits, listen to brewery-focused podcast episodes, and connect with other craft beer enthusiasts. 
                  The service includes features such as brewery discovery, social check-ins, leaderboards, and community engagement.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">3. User Accounts and Registration</h3>
                <p className="text-gray-700 leading-relaxed">
                  To use certain features of the Service, you must register for an account using a valid email address. 
                  You are responsible for maintaining the security of your account and password. You agree to accept 
                  responsibility for all activities that occur under your account.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">4. User Conduct</h3>
                <p className="text-gray-700 leading-relaxed mb-2">You agree not to use the Service to:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Upload, post, or transmit any content that is unlawful, harmful, threatening, abusive, or otherwise objectionable</li>
                  <li>Impersonate any person or entity or falsely state or misrepresent your affiliation with a person or entity</li>
                  <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                  <li>Attempt to gain unauthorized access to any portion of the Service</li>
                  <li>Use the Service for any commercial purposes without our express written consent</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">5. Check-ins and Location Data</h3>
                <p className="text-gray-700 leading-relaxed">
                  Beer Hop uses location services to verify brewery check-ins within a specified radius. By using the check-in feature, 
                  you consent to the collection and use of your location data for this purpose. Check-ins are subject to a 24-hour 
                  cooldown period per brewery per user.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">6. Content and Intellectual Property</h3>
                <p className="text-gray-700 leading-relaxed">
                  All content on Beer Hop, including but not limited to text, graphics, logos, images, and software, is the property 
                  of Beer Hop or its content suppliers and is protected by copyright and other intellectual property laws. 
                  You may not reproduce, distribute, or create derivative works from any content without express written permission.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">7. Privacy</h3>
                <p className="text-gray-700 leading-relaxed">
                  Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, 
                  to understand our practices regarding the collection and use of your personal information.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">8. Disclaimers</h3>
                <p className="text-gray-700 leading-relaxed">
                  The Service is provided "as is" and "as available" without any warranties of any kind. We do not warrant that 
                  the Service will be uninterrupted, error-free, or completely secure. Beer Hop is not responsible for the accuracy 
                  of brewery information or the availability of third-party services.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">9. Limitation of Liability</h3>
                <p className="text-gray-700 leading-relaxed">
                  In no event shall Beer Hop be liable for any indirect, incidental, special, consequential, or punitive damages, 
                  including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from 
                  your use of the Service.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">10. Termination</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, 
                  under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">11. Changes to Terms</h3>
                <p className="text-gray-700 leading-relaxed">
                  We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide 
                  at least 30 days notice prior to any new terms taking effect.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">12. Contact Information</h3>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us through the app or via email.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}