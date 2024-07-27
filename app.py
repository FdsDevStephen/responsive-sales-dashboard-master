from flask import Flask, request, jsonify, render_template
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
print("Static folder path:", app.static_folder)

file_path = "ENROLLMENT_NPTEL.xlsx"
data = pd.read_excel(file_path)

# Load the Udemy courses dataset
udemy_courses_path = 'udemy_courses.csv'
udemy_courses = pd.read_csv(udemy_courses_path)

def create_cosine_sim_matrix(courses):
    count_vect = CountVectorizer(stop_words='english')
    cv_mat = count_vect.fit_transform(courses['course_title'])
    cosine_sim_mat = cosine_similarity(cv_mat)
    return cosine_sim_mat, courses['course_title'], count_vect

cosine_sim_mat, course_titles, count_vect = create_cosine_sim_matrix(udemy_courses)

def get_course_by_user_name(user_name, data):
    user_record = data[data['Name'].str.contains(user_name, case=False, na=False)]
    if not user_record.empty:
        return user_record[['Name', 'CourseName']]
    else:
        return None

def recommend_similar_course(title):
    all_titles = course_titles.tolist() + [title]
    all_cv_mat = count_vect.transform(all_titles)
    cosine_sim_mat = cosine_similarity(all_cv_mat)

    sim_scores = cosine_sim_mat[-1][:-1]
    if sim_scores.size == 0:
        return None

    highest_sim_index = sim_scores.argmax()
    selected_course = udemy_courses.iloc[highest_sim_index].copy()
    selected_course['similarity_score'] = sim_scores[highest_sim_index]
    return selected_course[['course_title', 'similarity_score']]

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
    similar_recommendation = recommend_similar_course(course_title)
    if similar_recommendation is None:
        return jsonify({'error': 'No similar course found'}), 404

    return jsonify({
        'course_title': similar_recommendation['course_title'],
        'similarity_score': similar_recommendation['similarity_score']
    })

if __name__ == '__main__':
    app.run(debug=True)
