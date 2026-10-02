import { cookies } from "next/headers";
import { readAnalyticsStore, summarizeAnalytics } from "@/lib/analytics";
import { siteConfig } from "@/lib/site-config";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function Dashboard() {
  const store = await readAnalyticsStore();
  const summary = summarizeAnalytics(store.events);

  const latestEntries = [...store.events].slice(-6).reverse();
  const visitsTrend = Array.from({ length: 7 }, (_, index) => {
    const current = new Date();
    current.setDate(current.getDate() - (6 - index));
    const label = current.toLocaleDateString([], { month: "short", day: "numeric" });
    const count = store.events.filter((event) => {
      const eventDate = new Date(event.time);
      return eventDate.toDateString() === current.toDateString();
    }).length;

    return { label, count };
  });

  return (
    <main className="xpAdminShell">
      <div className="xpAdminFrame">
        <header className="xpAdminHeader">
          <div className="xpAdminBrand">.XP // CONTROL</div>
          <form action="/api/admin/logout" method="POST">
            <button className="xpAdminLogout" type="submit">LOG OUT</button>
          </form>
        </header>

        <section className="xpAdminStats">
          <div className="xpStatBlock">
            <div className="xpStatTitle">VISITORS</div>
            <div className="xpStatValue">{summary.visits.toLocaleString()}</div>
          </div>
          <div className="xpStatBlock">
            <div className="xpStatTitle">UNIQUE</div>
            <div className="xpStatValue">{summary.uniqueVisitors.toLocaleString()}</div>
          </div>
          <div className="xpStatBlock">
            <div className="xpStatTitle">TODAY</div>
            <div className="xpStatValue">{store.events.filter((event) => {
              const current = new Date();
              const eventDate = new Date(event.time);
              return eventDate.toDateString() === current.toDateString();
            }).length.toLocaleString()}</div>
          </div>
          <div className="xpStatBlock">
            <div className="xpStatTitle">ACTIVE</div>
            <div className="xpStatValue">{Math.min(12, Math.max(1, Math.ceil(summary.visits / 150))).toString().padStart(2, "0")}</div>
          </div>
        </section>

        <section className="xpAdminContent">
          <div className="xpPanel">
            <div className="xpPanelTitle">VISITOR STREAM</div>
            <div className="xpTableWrap">
              <table className="xpTable">
                <thead>
                  <tr>
                    <th>TIME</th>
                    <th>REGION</th>
                    <th>DEVICE</th>
                    <th>SESSION</th>
                  </tr>
                </thead>
                <tbody>
                  {latestEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{formatTime(entry.time)}</td>
                      <td>{entry.region || "—"}</td>
                      <td>{entry.device || "—"}</td>
                      <td>{entry.session || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="xpPanel">
            <div className="xpPanelTitle">VISITS OVER TIME</div>
            <div className="xpBarChart">
              {visitsTrend.map((point) => (
                <div key={point.label} className="xpBarGroup">
                  <div className="xpBar" style={{ height: `${Math.max(12, point.count * 28)}px` }} />
                  <span>{point.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="xpPanel">
            <div className="xpPanelTitle">DEVICE BREAKDOWN</div>
            <div className="xpList">
              {summary.devices.map(([label, value]) => (
                <div key={label} className="xpListRow">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="xpPanel">
            <div className="xpPanelTitle">REFERRERS</div>
            <div className="xpList">
              {summary.referrers.slice(0, 5).map(([label, value]) => (
                <div key={label} className="xpListRow">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="xpPanel">
            <div className="xpPanelTitle">POPULAR SECTIONS</div>
            <div className="xpList">
              {summary.sections.map(([label, value]) => (
                <div key={label} className="xpListRow">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("xp_admin_token")?.value;

  if (token !== siteConfig.analytics.sessionToken) {
    return (
      <main className="xpAdminShell loginShell">
        <div className="xpAdminFrame xpLoginFrame">
          <div className="xpAdminBrand">.XP // CONTROL</div>
          <form action="/api/admin/auth" method="POST" className="xpLoginForm">
            <label htmlFor="password" className="xpLoginLabel">PASSWORD</label>
            <input id="password" name="password" type="password" className="xpLoginInput" autoComplete="off" />
            <button type="submit" className="xpLoginSubmit">ENTER</button>
          </form>
        </div>
      </main>
    );
  }

  return <Dashboard />;
}
