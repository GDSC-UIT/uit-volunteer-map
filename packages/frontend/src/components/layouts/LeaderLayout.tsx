import { Outlet } from "react-router";
import BackgroundLayout from "./BackgroundLayout";
import TeamHeader from "@/components/layouts/MyTeamPageHeader";

export default function LeaderLayout() {
  return (
    <>
     <TeamHeader />
      <BackgroundLayout>
        <Outlet />
      </BackgroundLayout>
    </>
  );
}
