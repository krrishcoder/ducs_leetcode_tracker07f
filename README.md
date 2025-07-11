# LeetCode Student Ranking Dashboard

A modern, responsive dashboard built with **React** and **Tailwind CSS** that visualises LeetCode performance for a group of students. It consumes a minimal REST API (examples below) and presents rich, filterable statistics such as daily/weekly/monthly rankings and total solved problems.

![Dashboard Screenshot](docs/assets/dashboard.png)

---

## ✨ Features

| Feature                      | Description                                                                               |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| 🔄 **Live rankings**         | Fetches and displays real‑time scores from the backend.                                   |
| 🏆 **Multiple leaderboards** | Toggle between *Today*, *This Week*, *This Month* and *Total* views.                      |
| ➕ **Add / track users**      | Add new LeetCode usernames, trigger daily tracking & total refresh in one click.          |
| 🔍 **Search & filter**       | Instant search by display name or username.                                               |
| 📈 **Statistics cards**      | Highlights top performer, average score, total questions solved & number of active users. |
| 🎨 **Responsive UI**         | Tailwind‑powered layout with gradient accents and iconography from Lucide.                |

---

## 🗂️ Project Structure

```
ducs_leetcode_tracker07f/
├── public/
├── src/
│   ├── components/
│   │   └── StudentRankingDashboard.jsx  # ← main component (see code above)
│   ├── App.jsx
│   └── main.jsx
├── tailwind.config.js
├── index.html
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites

* Node.js ≥ 18.x
* npm ≥ 9.x (or pnpm / Yarn)

### 1. Clone & Install

```bash
$ git clone https://github.com/krrishcoder/ducs_leetcode_tracker07f.git
$ cd ducs_leetcode_tracker07f
$ npm install   # or pnpm install / yarn
```

### 2. Configure Environment

The component points to the demo backend on **Render**:

```js
const API_BASE = 'https://ducs-leetcode-tracker-1.onrender.com';
```

If you deploy your own backend, expose `VITE_API_BASE` in a `.env` file and update the code (or inject it at build‑time):

```bash
VITE_API_BASE=https://your-domain.com
```

### 3. Run Locally

```bash
$ npm run dev   # Vite dev server at http://localhost:5173
```

The dashboard will hot‑reload as you edit source files.

### 4. Build for Production

```bash
$ npm run build      # Generates static assets in dist/
$ npm run preview    # Preview the production build locally
```

---

## 🌐 Backend API Contract

> **Note:** The backend implementation is *not* included in this repo. Endpoints listed here must be provided by your server.

| Method | Endpoint                                     | Description                                        | Example Response (abridged)                                                                                                                                  |
| ------ | -------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GET`  | `/ranking?type=today\|this_week\|this_month` | Returns daily/weekly/monthly counts for each user. | `{ "results": [ { "_id": "…", "username": "alice", "totalCount": 123, "easy": 50, "medium": 60, "hard": 13 } ] }`                                            |
| `GET`  | `/total-leaderboard`                         | Returns cumulative stats.                          | `{ "stats": [ { "user": "…", "username": "bob", "totalSolved": 456, "easy": 200, "medium": 180, "hard": 76, "lastUpdated": "2025-07-10T09:48:25.000Z" } ] }` |
| `POST` | `/users`                                     | Add a new LeetCode username.                       | `{ "message": "User added" }`                                                                                                                                |
| `GET`  | `/refresh-total`                             | Re‑scrapes all users' totals.                      | `{ "message": "Totals refreshed" }`                                                                                                                          |
| `GET`  | `/track`                                     | Logs today’s progress.                             | `{ "message": "Daily progress recorded" }`                                                                                                                   |

All responses should be JSON. CORS must allow your frontend’s origin (see the *cors* snippet in `server.js`).

---

## 🛠️ Customisation Notes

* **UI Framework** – Tailwind classes are inlined; no external CSS files required.
* **Icons** – `lucide-react` provides the svg icons. Install via `npm i lucide-react`.
* **State Management** – Uses React hooks; no external state library.
* **Random Streaks** – The `streak` field is placeholder logic. Replace with real data if available.
* **Deployment** – Works seamlessly on Vercel, Netlify, or any static host. Ensure your backend domain is whitelisted in CORS.

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
   `git checkout -b feature/my-feature`
3. Commit your changes
   `git commit -m "Add cool feature"`
4. Push to branch
   `git push origin feature/my-feature`
5. Open a Pull Request

Found a bug or have a feature request? Feel free to open an *Issue*.

---

## 📄 License

This project is licensed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

---

> © 2025 • Made with ❤️ in **DUCS** by [@krrishcoder](https://github.com/krrishcoder)
