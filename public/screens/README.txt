Real ZingDates app screens used across the marketing site.

  splash.jpeg      - splash / loading screen
  getstarted.jpeg  - "The best place to meet your future partner"
  login.jpeg       - mobile-number login
  otp.jpeg         - 6-digit OTP verification
  signup.jpeg      - "Create your profile"

Filenames and order are declared in lib/screens.ts. To swap a screen, drop the
new file here under the SAME name; to add one, add an entry to SCREENS there.
Pages reference screens by key (screen('login')), never by array index.
