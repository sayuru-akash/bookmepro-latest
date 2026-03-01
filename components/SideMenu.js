"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { styled, useTheme } from "@mui/material/styles";
import Avatar from "@mui/material/Avatar";
import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import MenuContent from "./MenuContent";
import Button from "@mui/material/Button";
import { SquareArrowRight, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import axios from "axios";
import Image from "next/image";

import FileCopyIcon from "@mui/icons-material/FileCopy";

const drawerWidth = "full";

const Drawer = styled(MuiDrawer)(({ theme }) => ({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: "border-box",
  "& .MuiDrawer-paper": {
    width: drawerWidth,
    backgroundColor: "#ffffff",
    padding: "60px 10px",
    borderRadius: "5px 0px 0px 0px",
    overscrollBehavior: "none",
    overflowY: "auto",
    maxHeight: "100vh",
    height: "100vh",
  },
}));

export default function SideMenu({ session }) {
  const [coachData, setCoachData] = React.useState(null);
  const theme = useTheme();
  const router = useRouter();

  React.useEffect(() => {
    if (session?.user?.id) {
      axios
        .get(`/api/coach/${session.user.id}`)
        .then((response) => setCoachData(response.data))
        .catch((error) =>
          console.error(
            "Error fetching coach data:",
            error.response?.data || error.message,
          ),
        );
    }
  }, [session?.user?.id]);
  const BASE_URL =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_DOMAIN ||
    (typeof window !== "undefined" ? window.location.origin : "");

  const profileUrl = coachData ? `${BASE_URL}/coach/${coachData.id}` : "#";

  const handleCopy = () => {
    if (profileUrl) {
      navigator.clipboard.writeText(profileUrl);
      alert("Profile URL copied to clipboard!");
    }
  };

  const handleEditProfileClick = () => {
    router.push("/dashboard/profile");
  };

  const profileImage = coachData?.image
    ? `${coachData.image}`
    : "/default-profile.png";

  return (
    <div className="hidden md:block">
      <Drawer
        variant="permanent"
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: "10px",
          height: "calc(100vh - 60px)",
        }}
      >
        <div className="hidden md:block">
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "5px",
              mt: 7,
            }}
          >
            <div
              style={{
                backgroundImage: `url(${profileImage})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                width: "75px",
                height: "75px",
                borderRadius: "50%",
              }}
            />
            <Box>
              <Typography
                variant="body2"
                sx={{
                  width: "147px",
                  textAlign: "center",
                  fontFamily: "Kanit, sans-serif",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "black",
                  mt: 1,
                }}
              >
                {coachData?.firstName}
              </Typography>

              {/* Correctly using the Link component */}
              <Link href="/dashboard/profile">
                <Typography
                  variant="caption"
                  sx={{
                    width: "198px",
                    fontFamily: "Kanit, sans-serif",
                    fontSize: "15px",
                    fontWeight: 400,
                    textAlign: "center",
                    color: "#037D40",
                    padding: 0,
                  }}
                >
                  {coachData?.title}
                </Typography>
              </Link>
            </Box>

            <Button
              component={Link}
              href="/dashboard/profile"
              sx={{
                mt: 1,
                paddingY: 2,
                paddingX: 4,
                width: "full",
                height: "full",
                gap: "20px",
                borderRadius: "5px",
                bgcolor: "#037D40",
                color: "white",
                display: "flex",
                fontSize: "14px",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Kanit, sans-serif",
                "&:hover": { bgcolor: "#036b34" },
              }}
              size="medium"
            >
              Edit Profile
              <SquareArrowRight sx={{ color: "white", fill: "white" }} />
            </Button>
          </Box>

          <div className="mt-2">
            <Divider />
          </div>
          <MenuContent session={session} />
          <div className="flex justify-center">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                fontWeight: 700,
                fontFamily: "Kanit, sans-serif",
              }}
            >
              <Button
                startIcon={
                  <LogOut
                    sx={{ fill: theme.palette.text.primary, padding: "5px" }}
                  />
                }
                sx={{
                  fontFamily: "Kanit, sans-serif",
                  color: "#037D40",
                  textTransform: "none",
                  display: "flex",
                  alignItems: "center",
                  opacity: 0.8,
                  "&:hover": {
                    bgcolor: "#E6F2EC",
                  },
                }}
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Log Out
              </Button>
            </Box>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
