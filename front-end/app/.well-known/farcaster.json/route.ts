import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
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

