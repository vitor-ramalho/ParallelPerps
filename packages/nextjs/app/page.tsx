import Head from "next/head";

export default function Home() {
  return (
    <div className="bg-custom-gradient min-h-screen text-white">
      <Head>
        <title>Parallel Perps</title>
        <meta
          name="description"
          content="Experience seamless perpetual trading with our innovative staking and yield delegation system."
        />
      </Head>

      <section className="py-12 text-center">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold mb-4">Welcome to Parallel Perps</h2>
          <p className="text-lg mb-8">
            Experience seamless perpetual trading with our innovative staking and yield delegation system.
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
            <div className="p-6 bg-base-100 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-2">Secure Staking</h3>
              <p>Stake your MON tokens securely and earn hasMON, a staking derivative token.</p>
            </div>
            <div className="p-6 bg-base-100 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-2">Passive Yield</h3>
              <p>Delegate your staked MON to earn passive yield rewards effortlessly.</p>
            </div>
            <div className="p-6 bg-base-100 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-2">Leverage Trading</h3>
              <p>Use hasMON as collateral to trade with leverage on our platform.</p>
            </div>
            <div className="p-6 bg-base-100 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-2">Real-time Pricing</h3>
              <p>Benefit from accurate collateral valuation with real-time price feeds.</p>
            </div>
            <div className="p-6 bg-base-100 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-2">Automated Liquidation</h3>
              <p>Protect your positions with our automated liquidation mechanism.</p>
            </div>
            <div className="p-6 bg-base-100 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-2">Efficient Rewards</h3>
              <p>Receive yield rewards efficiently with gas-optimized distribution.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-12">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-base-100 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-2">1. Stake MON Tokens</h3>
              <p>Stake your MON tokens in the MonadStaking contract to receive hasMON tokens.</p>
            </div>
            <div className="p-6 bg-base-100 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-2">2. Earn Passive Yield</h3>
              <p>Delegate your staked MON to earn passive yield rewards over time.</p>
            </div>
            <div className="p-6 bg-base-100 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-2">3. Trade with Leverage</h3>
              <p>Use hasMON as collateral to open leveraged trading positions on our platform.</p>
            </div>
            <div className="p-6 bg-base-100 rounded-lg shadow-lg">
              <h3 className="text-2xl font-bold mb-2">4. Receive Rewards</h3>
              <p>Enjoy efficient reward distribution with our gas-optimized system.</p>
            </div>
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
