export function appointmentNotificationEvents(appointment, transition) {
  return (
    {
      created: [
        {
          eventType: "booking_received",
          recipientType: "student",
          recipient: appointment.email,
        },
        {
          eventType: "new_booking_request",
          recipientType: "coach",
          recipient: null,
        },
      ],
      approved: [
        {
          eventType: "booking_approved",
          recipientType: "student",
          recipient: appointment.email,
        },
      ],
      declined: [
        {
          eventType: "booking_declined",
          recipientType: "student",
          recipient: appointment.email,
        },
      ],
      cancelled: [
        {
          eventType: "booking_cancelled_student",
          recipientType: "student",
          recipient: appointment.email,
        },
        {
          eventType: "booking_cancelled_coach",
          recipientType: "coach",
          recipient: null,
        },
      ],
      rescheduled: [
        {
          eventType: "booking_rescheduled_student",
          recipientType: "student",
          recipient: appointment.email,
        },
        {
          eventType: "booking_rescheduled_coach",
          recipientType: "coach",
          recipient: null,
        },
      ],
      completed: [
        {
          eventType: "booking_completed",
          recipientType: "student",
          recipient: appointment.email,
        },
      ],
      no_show: [
        {
          eventType: "booking_no_show",
          recipientType: "student",
          recipient: appointment.email,
        },
      ],
    }[transition] || []
  );
}
