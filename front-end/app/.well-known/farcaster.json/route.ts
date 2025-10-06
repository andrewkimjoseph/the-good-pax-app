import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    "accountAssociation": {
      "header": "eyJmaWQiOjgxMTA0NCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweEE5NGM4Mzc3NTdGYTg2Qjk1OEVlMjZFNzU0NDY4QjA3OTBlNjU3NjAifQ",
      "payload": "eyJkb21haW4iOiJ0aGVnb29kcGF4LmFwcCJ9",
      "signature": "MHg3N2UxYmZjZjBlYzdhNjU1MWJmOTcxNjgwMjJlOWM4NDcxNGE4OTM1YzRlN2Q1N2VkZTE1ODcwODI2YzE2MDA5MTU3ZTE5ZDgwZTZlZjlkNTkxYzFkMDE1Y2I5MDc2MDU0YmMzZTdkMDJiOGEyNDE3NGRiYjA2MmM3NzNjOThlODFj"
    },
    "frame": {
      "name": "The Good Pax App",
      "version": "1",
      "iconUrl": "https://thegoodpax.app/thegoodpaxapp.svg",
      "homeUrl": "https://thegoodpax.app",
      "imageUrl": "https://thegoodpax.app/thegoodpaxapp.svg",
      "splashImageUrl": "https://thegoodpax.app/thegoodpaxapp.svg",
      "splashBackgroundColor": "#f5f0ec",
      "subtitle": "The GoodDollar wrapper on Farcaster - claim UBI today!",
      "heroImageUrl": "https://thegoodpax.app/thegoodpaxapp.svg",
      "description": "The Good Pax App bring GoodDollar UBI claiming and Engagement Rewards, right in Farcaster. Powered by Canvassing.",
      "primaryCategory": "finance"
    }
  };

  return NextResponse.json(config);
}

