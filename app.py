from flask import Flask, request, jsonify
import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

# Load data
file_path = "ENROLLMENT_NPTEL.xlsx"
data = pd.read_excel(file_path)
udemy_courses_path = 'udemy_courses.csv'
udemy_courses = pd.read_csv(udemy_courses_path)

# Create cosine similarity matrix
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
        return {'course_title': 'No similar course found'}
    highest_sim_index = sim_scores.argmax()
    selected_course = udemy_courses.iloc[highest_sim_index].copy()
    selected_course['similarity_score'] = sim_scores[highest_sim_index]
    return selected_course[['course_title', 'similarity_score']].to_dict()

@app.route('/get_course', methods=['POST'])
def get_course():
    user_name = request.json.get('user_name')
    course_info = get_course_by_user_name(user_name, data)
    if course_info is not None:
        course_title = course_info.iloc[0]['CourseName']
        similar_recommendation = recommend_similar_course(course_title)
        return jsonify({'course_info': course_info.to_dict(orient='records'), 'recommendation': similar_recommendation})
    else:
        return jsonify({'message': f"No records found for user: {user_name}"}), 404

if __name__ == '__main__':
    app.run(debug=True)
