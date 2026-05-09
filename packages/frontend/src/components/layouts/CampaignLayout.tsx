import { Outlet } from "react-router";
import BackgroundLayout from "./BackgroundLayout";
import GuestHeader from "./GuestHeader";

export default function CampaignLayout() {
  return (
    <>
      <GuestHeader />
      <BackgroundLayout>
        <Outlet />
      </BackgroundLayout>
    </>
  );
}
