import Head from "next/head";
import { Card } from "../ui/card";

export default function LandingPage() {
  return (
    <div className="bg-custom-gradient min-h-screen text-white">
      <Head>
        <title>Parallel Perps: Revolutionizing Perpetual Trading on Monad</title>
        <meta
          name="description"
          content="Parallel Perps introduces a groundbreaking perpetual futures trading platform built exclusively for Monad's high-performance blockchain."
        />
      </Head>

      <section className="py-12 text-center">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold mb-4">Welcome to Parallel Perps</h2>
          <p className="text-lg mb-8">
            Revolutionizing perpetual trading on Monad with our innovative staking and yield delegation system.
          </p>
          <a href="#features" className="btn btn-primary">
            Learn More
          </a>
        </div>
      </section>

      <section id="features" className="py-12 bg-base-200">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-medium text-base-content/60">Secure Staking</h3>
              <p className="text-3xl font-bold my-2">
                Stake your MON tokens securely and earn hasMON, a staking derivative token.
              </p>
            </Card>
            <Card className="p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-medium text-base-content/60">Passive Yield</h3>
              <p className="text-3xl font-bold my-2">
                Delegate your staked MON to earn passive yield rewards effortlessly.
              </p>
            </Card>
            <Card className="p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-medium text-base-content/60">Leverage Trading</h3>
              <p className="text-3xl font-bold my-2">
                Use hasMON as collateral to trade with leverage on our platform.
              </p>
            </Card>
            <Card className="p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-medium text-base-content/60">Real-time Pricing</h3>
              <p className="text-3xl font-bold my-2">
                Benefit from accurate collateral valuation with real-time price feeds.
              </p>
            </Card>
            <Card className="p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-medium text-base-content/60">Automated Liquidation</h3>
              <p className="text-3xl font-bold my-2">
                Protect your positions with our automated liquidation mechanism.
              </p>
            </Card>
            <Card className="p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-medium text-base-content/60">Efficient Rewards</h3>
              <p className="text-3xl font-bold my-2">
                Receive yield rewards efficiently with gas-optimized distribution.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-12">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-medium text-base-content/60">1. Stake MON Tokens</h3>
              <p className="text-3xl font-bold my-2">
                Stake your MON tokens in the MonadStaking contract to receive hasMON tokens.
              </p>
            </Card>
            <Card className="p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-medium text-base-content/60">2. Earn Passive Yield</h3>
              <p className="text-3xl font-bold my-2">
                Delegate your staked MON to earn passive yield rewards over time.
              </p>
            </Card>
            <Card className="p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-medium text-base-content/60">3. Trade with Leverage</h3>
              <p className="text-3xl font-bold my-2">
                Use hasMON as collateral to open leveraged trading positions on our platform.
              </p>
            </Card>
            <Card className="p-6 flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-medium text-base-content/60">4. Receive Rewards</h3>
              <p className="text-3xl font-bold my-2">
                Enjoy efficient reward distribution with our gas-optimized system.
              </p>
            </Card>
          </div>
        </div>
      </section>

      <section id="contact" className="py-12 bg-base-200">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
          <p className="mb-4">Have questions? Reach out to us!</p>
          <a href="mailto:support@parallelperps.com" className="btn btn-primary">
            Email Us
          </a>
        </div>
      </section>
    </div>
  );
}
