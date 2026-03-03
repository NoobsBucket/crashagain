import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.redirect("https://crashcart.shop");
  const cookiesToDelete = [
    "__clerk_db_jwt",
    "__client_uat", 
    "__session",
    "__refresh",
  ];
  
  cookiesToDelete.forEach(name => {
    res.cookies.set(name, "", {
      expires: new Date(0),
      path: "/",
      domain: ".crashcart.shop",
    });
  });
  
  return res;
}