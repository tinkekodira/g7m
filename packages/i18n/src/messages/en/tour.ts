/** The five-stop app tour, and the card that offers it. */
export const tour = {
  stops: [
    {
      title: 'Start a workout',
      text: 'Ready to train? Start your workout here, or return to a session already in progress.',
    },
    {
      title: 'Progress & history',
      text: 'Open Progress from Home to review your training and revisit past workouts.',
    },
    {
      title: 'Exercise library',
      text: 'Browse exercises from Home to search the full library and find coaching for each movement.',
    },
    {
      title: 'Your interactive 3D body',
      text: 'Find the 3D body in Learn. Tap a muscle to discover exercises that train it.',
    },
    {
      title: 'Train with friends',
      text: 'Add friends here, compare your training, and challenge each other.',
    },
  ],
  position: (index: number, total: number) => `${String(index)} of ${String(total)}`,
  skip: 'Skip tour',
  opening: 'Opening this stop… You can continue or skip.',
  finish: 'Finish tour',
  replay: 'Take app tour',
  invitationTitle: 'Find your way around',
  invitationBody: 'Five quick stops to discover your training tools.',
  take: 'Take a quick tour',
  dismissLabel: 'Dismiss app tour invitation',
  dismiss: 'Dismiss',
};
