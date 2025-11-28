import { railwayDB } from "../../db/connection.js";

consumer.run({
  eachMessage: async ({ topic, message }) => {
    const event = JSON.parse(message.value.toString());

    const { metric_name, metric_date, metric_value, target_value } = event;

    await railwayDB.execute(
      `
      INSERT INTO daily_metrics (metric_name, metric_date, metric_value, target_value, currency)
      VALUES (?, ?, ?, ?, 'MYR')
      ON DUPLICATE KEY UPDATE
        metric_value = VALUES(metric_value),
        target_value = VALUES(target_value)
      `,
      [metric_name, metric_date, metric_value, target_value]
    );

    console.log(`📥 Inserted metric event → ${metric_name} @ ${metric_date}`);
  },
});
