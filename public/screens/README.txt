Real ZingDates app screens used across the marketing site.

  companions.png  - Companions tab, "Book a verified companion"
  likes.png       - Likes tab, "People who liked you"
  chats.png       - Chats list
  support.png     - Help & Support form

Store-listing artwork (phone mockup + copy baked into the image). Shown on its
own, never inside a PhoneFrame:

  poster-match.png        - "Find Your Perfect Match"
  poster-companion.png    - "Find Your Perfect Companion"
  poster-login.png        - "Quick, Secure & Hassle-Free Login"
  poster-connections.png  - "Real People. Real Connections."

Filenames and order are declared in lib/screens.ts. To swap a screen, drop the
new file here under the SAME name; to add one, add an entry to SCREENS there.
Pages reference screens by key (screen('chats')), never by array index.
