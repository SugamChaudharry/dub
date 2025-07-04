"use server";

import { qstash } from "@/lib/cron";
import { CUTOFF_PERIOD_ENUM } from "@/lib/partners/cutoff-period";
import { stripe } from "@/lib/stripe";
import { APP_DOMAIN_WITH_NGROK } from "@dub/utils";
import z from "zod";
import { authActionClient } from "../safe-action";

const confirmPayoutsSchema = z.object({
  workspaceId: z.string(),
  paymentMethodId: z.string(),
  cutoffPeriod: CUTOFF_PERIOD_ENUM,
});

const allowedPaymentMethods = ["us_bank_account", "card", "link"];

export const confirmPayoutsAction = authActionClient
  .schema(confirmPayoutsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { workspace, user } = ctx;
    const { paymentMethodId, cutoffPeriod } = parsedInput;

    if (!workspace.stripeId) {
      throw new Error("Workspace does not have a valid Stripe ID.");
    }

    if (workspace.payoutsUsage >= workspace.payoutsLimit) {
      throw new Error("Payouts limit exceeded.");
    }

    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    if (paymentMethod.customer !== workspace.stripeId) {
      throw new Error("Invalid payout method.");
    }

    if (!allowedPaymentMethods.includes(paymentMethod.type)) {
      throw new Error(
        "We only support ACH and Card for now. Please update your payout method to one of these.",
      );
    }

    const qstashResponse = await qstash.publishJSON({
      url: `${APP_DOMAIN_WITH_NGROK}/api/cron/payouts/confirm`,
      body: {
        workspaceId: workspace.id,
        userId: user.id,
        paymentMethodId,
        cutoffPeriod,
      },
    });

    if (qstashResponse.messageId) {
      console.log(`Message sent to Qstash with id ${qstashResponse.messageId}`);
    } else {
      console.error("Error sending message to Qstash", qstashResponse);
    }
  });
