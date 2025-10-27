INSERT INTO Users (email, name) VALUES ('test@example.com', 'Test User');

INSERT INTO Trips (user_id, title, city, country, start_date, end_date) 
VALUES
(1, '🌸 tokyo ~ 🌸', 'Tokyo', 'Japan', '2024-05-02', '2024-05-13'),
(1, 'detroit 🏙️', 'Detroit', 'United States', '2024-04-04', '2024-04-07');

INSERT INTO LOCATIONS (trip_id, x, y, name, address, rating, cost_level, notes, time_needed, best_time_to_visit)
VALUES
(1, 139.7967, 35.7148, 'Sensō-ji / Asakusa', '2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan', 5.0, '$-$$', 'For the Temple: "Go at 7am - way fewer crowds"\nFor the Sushi: "Best tuna ever. Cash only!"\nFor the Plushies: "Cute but overpriced. Don Quijote has same ones cheaper."', 120, '7:00 am - 9:00 am'),
(1, 139.7017, 35.6586, 'Shibuya Crossing', 'Shibuya, Tokyo, Japan', 4.0, 'Free', 'Iconic crossing! Best viewed from Starbucks 2nd floor.', 30, '6:00 pm - 8:00 pm'),
(1, 139.6993, 35.6764, 'Meiji Shrine', '1-1 Yoyogikamizonocho, Shibuya City, Tokyo 151-8557, Japan', 5.0, 'Free', 'Peaceful shrine in the heart of Tokyo. Write a wish on an ema!', 60, '8:00 am - 10:00 am'),
(2, -83.0654, 42.3594, 'Detroit Institute of Arts', '5200 Woodward Ave, Detroit, MI 48202, USA', 4.0, '$$', 'For the Museum: "Diego Rivera murals are a must-see"\nFor the Coffee Shop: "Cafe DIA has decent pastries"', 120, '10:00 am - 12:00 pm'),
(2, -82.9858, 42.3400, 'Belle Isle Park', 'Detroit, MI 48207, USA', 3.0, 'Free', 'Nice island park. Good for walking but nothing special.', 90, '2:00 pm - 5:00 pm'),
(2, -83.0497, 42.3314, 'Lafayette Coney Island', '118 W Lafayette Blvd, Detroit, MI 48226, USA', 2.0, '$', 'For the Hot Dogs: "Overrated. American Coney Island next door is better"', 30, '12:00 pm - 1:00 pm');

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

INSERT INTO Photos (location_id, user_id, x, y, file_url, is_cover_photo)
VALUES
(1, 1, 139.7967, 35.7148, '/uploads/photos/1761521952_dfa07467.jpg', TRUE),
(1, 1, 139.7968, 35.7149, '/uploads/photos/1761521984_f113db8f.jpg', FALSE),
(1, 1, 139.7966, 35.7147, '/uploads/photos/japan-1.png', FALSE),
(1, 1, 139.7969, 35.7150, '/uploads/photos/japan-2.png', FALSE),
(3, 1, 139.6993, 35.6764, '/uploads/photos/japan-3.png', TRUE),
(2, 1, 139.7017, 35.6586, '/uploads/photos/japan-4.png', TRUE),
(3, 1, 139.6994, 35.6765, '/uploads/photos/japan-5.png', FALSE),
(1, 1, 139.7970, 35.7151, '/uploads/photos/japan-6.png', FALSE),
(4, 1, -83.0654, 42.3594, '/uploads/photos/detroit-1.png', TRUE),
(4, 1, -83.0655, 42.3595, '/uploads/photos/detroit-2.png', FALSE),
(5, 1, -82.9858, 42.3400, '/uploads/photos/detroit-3.png', TRUE),
(6, 1, -83.0497, 42.3314, '/uploads/photos/detroit-4.png', TRUE),
(6, 1, -83.0498, 42.3315, '/uploads/photos/detroit-5.png', FALSE);