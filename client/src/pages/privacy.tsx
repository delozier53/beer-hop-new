import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function Privacy() {
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
            <CardTitle className="text-2xl">Privacy Policy</CardTitle>
            <p className="text-sm text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <div className="space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3">1. Information We Collect</h3>
                
                <h4 className="font-semibold mb-2">Personal Information</h4>
                <p className="text-gray-700 leading-relaxed mb-3">
                  When you create an account, we collect your email address, name, username, and optional location information. 
                  This information is necessary to provide you with personalized service and to enable social features.
                </p>

                <h4 className="font-semibold mb-2">Location Information</h4>
                <p className="text-gray-700 leading-relaxed mb-3">
                  When you use the check-in feature, we collect your precise location to verify that you are within the specified 
                  radius of a brewery. This location data is used solely for check-in verification and is not stored permanently.
                </p>

                <h4 className="font-semibold mb-2">Usage Information</h4>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We automatically collect information about how you use Beer Hop, including check-ins, favorite breweries, 
                  and interaction with podcast content. This helps us improve the service and provide personalized recommendations.
                </p>

                <h4 className="font-semibold mb-2">Device and Notification Information</h4>
                <p className="text-gray-700 leading-relaxed">
                  To send push notifications, we collect device tokens and notification preferences. We may also collect 
                  information about your device type, operating system, and app version to ensure notifications are 
                  delivered properly and formatted correctly for your device.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">2. How We Use Your Information</h3>
                <p className="text-gray-700 leading-relaxed mb-2">We use the information we collect to:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Provide and maintain the Beer Hop service</li>
                  <li>Verify brewery check-ins using location data</li>
                  <li>Create and maintain leaderboards and user statistics</li>
                  <li>Send you verification codes and important service notifications</li>
                  <li>Deliver push notifications about breweries, events, podcasts, and social activities based on your preferences</li>
                  <li>Improve our service and develop new features</li>
                  <li>Prevent fraud and ensure the security of our platform</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">3. Information Sharing and Disclosure</h3>
                
                <h4 className="font-semibold mb-2">Public Information</h4>
                <p className="text-gray-700 leading-relaxed mb-3">
                  Your username, check-in count, and leaderboard position are visible to other users as part of the social 
                  features of Beer Hop. Your email address and precise location data are never shared publicly.
                </p>

                <h4 className="font-semibold mb-2">Service Providers</h4>
                <p className="text-gray-700 leading-relaxed mb-3">
                  We use third-party service providers to help us operate Beer Hop, including email delivery services 
                  (SendGrid), push notification providers, and database hosting. These providers have access to your 
                  personal information only to perform specific tasks on our behalf and are obligated to keep it confidential.
                </p>

                <h4 className="font-semibold mb-2">Legal Requirements</h4>
                <p className="text-gray-700 leading-relaxed">
                  We may disclose your information if required to do so by law or in response to valid requests by 
                  public authorities (e.g., a court or government agency).
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">4. Data Security</h3>
                <p className="text-gray-700 leading-relaxed">
                  We implement appropriate technical and organizational security measures to protect your personal information 
                  against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over 
                  the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">5. Data Retention</h3>
                <p className="text-gray-700 leading-relaxed">
                  We retain your personal information for as long as your account is active or as needed to provide you services. 
                  We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, 
                  and enforce our agreements. Check-in location data is not permanently stored after verification.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">6. Your Rights and Choices</h3>
                <p className="text-gray-700 leading-relaxed mb-2">You have the right to:</p>
                <ul className="list-disc pl-6 text-gray-700 space-y-1">
                  <li>Access and update your personal information through your account settings</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt out of location services (though this will disable check-in functionality)</li>
                  <li>Control push notification preferences through your device settings or app settings</li>
                  <li>Request a copy of your personal data</li>
                  <li>Request correction of inaccurate personal data</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">7. Children's Privacy</h3>
                <p className="text-gray-700 leading-relaxed">
                  Beer Hop is intended for users who are at least 21 years old, consistent with legal drinking age requirements. 
                  We do not knowingly collect personal information from children under 21. If you are a parent or guardian and 
                  believe your child has provided us with personal information, please contact us.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">8. International Data Transfers</h3>
                <p className="text-gray-700 leading-relaxed">
                  Your information may be transferred to and processed in countries other than your own. We ensure that 
                  such transfers are made in accordance with applicable privacy laws and with appropriate safeguards in place.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">9. Changes to This Privacy Policy</h3>
                <p className="text-gray-700 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes by posting the 
                  new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this 
                  Privacy Policy periodically for any changes.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-3">10. Contact Us</h3>
                <p className="text-gray-700 leading-relaxed">
                  If you have any questions about this Privacy Policy or our privacy practices, please contact us through 
                  the app or via email. We will respond to your inquiries within a reasonable timeframe.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}