from flask import Flask, request, jsonify, render_template
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
print("Static folder path:", app.static_folder)

file_path = "ENROLLMENT_NPTEL.xlsx"
data = pd.read_excel(file_path)

# Load the new courses dataset
new_courses_path = 'crsnew_1818.csv'
new_courses = pd.read_csv(new_courses_path)

def create_cosine_sim_matrix(courses):
    count_vect = CountVectorizer(stop_words='english')
    cv_mat = count_vect.fit_transform(courses['cn'])  # Using the correct column name
    cosine_sim_mat = cosine_similarity(cv_mat)
    return cosine_sim_mat, courses['cn'], count_vect  # Using the correct column name

cosine_sim_mat, course_titles, count_vect = create_cosine_sim_matrix(new_courses)

def get_course_by_user_name(user_name, data):
    user_record = data[data['Name'].str.contains(user_name, case=False, na=False)]
    if not user_record.empty:
        return user_record[['Name', 'CourseName']]
    else:
        return None

def recommend_similar_courses(title, top_n=3):
    all_titles = course_titles.tolist() + [title]
    all_cv_mat = count_vect.transform(all_titles)
    cosine_sim_mat = cosine_similarity(all_cv_mat)

    sim_scores = cosine_sim_mat[-1][:-1]
    if sim_scores.size == 0:
        return None

    top_indices = sim_scores.argsort()[-top_n:][::-1]
    recommendations = new_courses.iloc[top_indices].copy()
    recommendations['similarity_score'] = sim_scores[top_indices]
    return recommendations[['cn', 'similarity_score']]  # Using the correct column name

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/recommend', methods=['POST'])
def recommend():
    user_name = request.json.get('user_name')
    if not user_name:
        return jsonify({'error': 'No user name provided'}), 400

    course_info = get_course_by_user_name(user_name, data)
    if course_info is None or course_info.empty:
        return jsonify({'error': f'No records found for user: {user_name}'}), 404

    course_title = course_info.iloc[0]['CourseName']
    similar_recommendations = recommend_similar_courses(course_title, top_n=3)
    if similar_recommendations is None or similar_recommendations.empty:
        return jsonify({'error': 'No similar courses found'}), 404

    recommendations_list = similar_recommendations.to_dict(orient='records')
    
    return jsonify({
        'registered_course': course_title,
        'recommendations': recommendations_list
    })

if __name__ == '__main__':
    app.run(debug=True)
