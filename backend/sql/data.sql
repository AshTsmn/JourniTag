INSERT INTO Users (email, name) VALUES ('test@example.com', 'Test User');

INSERT INTO Trips (user_id, title, city, country, start_date, end_date) 
VALUES
(1, '🌸 tokyo ~ 🌸', 'Tokyo', 'Japan', '2024-05-02', '2024-05-13'),
(1, 'detroit 🏙️', 'Detroit', 'United States', '2024-04-04', '2024-04-07');

INSERT INTO LOCATIONS (trip_id, x, y, name, address, rating, cost_level, notes, time_needed, best_time_to_visit)
VALUES
(1, 0, 0, 'Sensō-ji / Asakusa', '2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan', 5.0, '$-$$', 'For the Temple: "Go at 7am - way fewer crowds"\nFor the Sushi: "Best tuna ever. Cash only!"\nFor the Plushies: "Cute but overpriced. Don Quijote has same ones cheaper."', 120, '7:00 am - 9:00 am'),
(1, 0, 0, 'Shibuya Crossing', 'Shibuya, Tokyo, Japan', 4.0, 'Free', 'Iconic crossing! Best viewed from Starbucks 2nd floor.', 30, '6:00 pm - 8:00 pm'),
(1, 0, 0,  'Meiji Shrine', '1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557, Japan', 5.0, 'Free', 'Peaceful shrine in the heart of Tokyo. Write a wish on an ema!', 60, '8:00 am - 10:00 am'),
(2, 0, 0, 'Detroit Institute of Arts', '5200 Woodward Ave, Detroit, MI 48202, USA', 4.0, '$$', 'For the Museum: "Diego Rivera murals are a must-see"\nFor the Coffee Shop: "Cafe DIA has decent pastries"', 120, '10:00 am - 12:00 pm'),
(2, 0, 0,  'Belle Isle Park', 'Detroit, MI 48207, USA', 3.0, 'Free', 'Nice island park. Good for walking but nothing special.', 90, '2:00 pm - 5:00 pm'),
(2, 0, 0, 'Lafayette Coney Island', '118 W Lafayette Blvd, Detroit, MI 48226, USA', 2.0, '$', 'For the Hot Dogs: "Overrated. American Coney Island next door is better"', 30, '12:00 pm - 1:00 pm');

INSERT INTO Tags (name)
VALUES
('Cultural'),
('Local eats'),
('Splurge-worthy'),
('Tourist Spot'),
('Nature'),
('Hidden gem');

INSERT INTO LocationTags (location_id, tag_id)
VALUES
 (1, 1),
 (1, 2),
 (1, 3),
 (1, 4),
 (2, 4),
 (2, 1),
 (3, 1),
 (3, 5),
 (3, 6),
 (4, 5),
 (4, 6),
 (5, 2);